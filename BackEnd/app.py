from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from flask import send_file
import threading
import bcrypt
from pymongo import MongoClient
import tempfile
import os
import uuid
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_mistralai import MistralAIEmbeddings
from langchain.chat_models import init_chat_model
from langchain_core.prompts import ChatPromptTemplate

from pinecone import Pinecone, ServerlessSpec
import jwt
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from functools import wraps
from flask import request



load_dotenv()

app = Flask(__name__)
CORS(app)

SECRET_KEY=os.getenv("JWT_SECRET_KEY")  # Use a secure secret key in production


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization")

        if not token:
            return jsonify({"error": "Token is missing!"}), 401
        try:
            token=token.split(" ")[1]
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            request.user_id = data["user_id"]
        except :
            return jsonify({"error": "Invalid or Expired Token !!!"}), 401
        return f( *args, **kwargs)
    return decorated

# ================= DATABASE =================
mongo = MongoClient(os.getenv("MONGO_URI"))
db = mongo["rag_app"]

# ================= VECTOR DB =================
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index_name="rag-app"

existing_indexes=[i["name"] for i in pc.list_indexes()]

if index_name not in existing_indexes:
    pc.create_index(
        name=index_name,
        dimension=1024,
        metric="cosine",
        spec=ServerlessSpec(
            cloud="aws",
            region="us-east-1"
        )
    )
index=pc.Index(index_name)

# ================= EMBEDDING =================
embedding_model = MistralAIEmbeddings(model="mistral-embed")

# ================= LLM =================
llm = init_chat_model(
    model="mistral-small-latest",
    model_provider="mistralai",
    temperature=0.2
)

# ================= PROMPTS (UNCHANGED) =================
strict_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a strict RAG assistant.
    Answer ONLY using the Provided Context.

    Rules:
    1. Do NOT use your own Knowledge.
    2. Do NOT guess or assume.

    3. if the answer is not present in the context , reply: " I could not find the answer in the provided document. "
    4. Keep Answer concise and based only on context .
    5. Show the reponse only that is written in the context.

    6. Answer using clean formatting:
    7. Use Bullet Points when needed
    8. Use Headings
    9. Use code blocks for code

    10. Keep it structured and readable
    """),
    ("human", "Context:\n{context}\n\nQuestion:\n{question}")
])

smart_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a helpful AI assistant.

Use the provided context as primary source.
But you can also use your knowledge to improve the answer.

Rules:
1. Answer using clean formatting:
2. Use Bullet Points when needed
3. Use Headings
4. Use code blocks for code

5. Keep it structured and readable

Keep it clear and helpful.
"""),
    ("human", "Context:\n{context}\n\nQuestion:\n{question}")
])

# ================= AUTH =================
@app.route("/register", methods=["POST"])
def register():
    
    data = request.json

    if db.users.find_one({"email": data["email"]}):
        return jsonify({"error": "User already exists"}), 400

    hashed = bcrypt.hashpw(data["password"].encode(), bcrypt.gensalt())

    user = db.users.insert_one({
        "name": data["name"],
        "email": data["email"],
        "password": hashed
    })

    return jsonify({"user_id": str(user.inserted_id)})

@app.route("/login", methods=["POST"])
def login():
    #
    data = request.json

    user = db.users.find_one({"email": data["email"]})

    if not user:
        return jsonify({"error": "Invalid email or password"}), 400
    
    if not bcrypt.checkpw(data["password"].encode(), user["password"]):
        return jsonify({"error": "Invalid email or password"}), 400

    token= jwt.encode({
        "user_id": str(user["_id"]),
        "exp": datetime.now(timezone.utc) + timedelta(hours=24)
    }, SECRET_KEY, algorithm="HS256")

    if bcrypt.checkpw(data["password"].encode(), user["password"]):
        return jsonify({"user_id": str(user["_id"]), "token": token})

    return jsonify({"error": "Invalid password"}), 400

def getIDFromToken(token):
    token=request.headers.get("Authorization")

    if not token:
        return None


    try:
        token=token.split(" ")[1]
        decoded=jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return decoded["user_id"]
    except Exception as e:
        print("Token Error :" , str(e))
        return None




@app.route("/documents", methods=["GET"])

def get_documents():

    #

    user_id = getIDFromToken(request.headers.get("Authorization"))

    docs = list(db.documents.find({"user_id": user_id}, {"_id": 0}))

    return jsonify(docs)


@app.route("/documents/<doc_id>", methods=["DELETE"])

def delete_document(doc_id):

    

    user_id = getIDFromToken(request.headers.get("Authorization"))

    # 🔥 DELETE FROM PINECONE
    index.delete(filter={
        "user_id": user_id,
        "doc_id": doc_id
    })

    # 🔥 DELETE FROM DB
    db.documents.delete_one({
        "doc_id": doc_id,
        "user_id": user_id
    })

    return jsonify({"message": "Deleted"})




@app.route("/documents/preview/<doc_id>", methods=["GET"])
def preview_document(doc_id):
    
    user_id = getIDFromToken(request.headers.get("Authorization"))

    doc = db.documents.find_one({
        "doc_id": doc_id,
        "user_id": user_id
    })

    if not doc:
        return jsonify({"error": "Not found"}), 404

    # 🔥 You must store file path while uploading
    file_path = doc.get("file_path")

    return send_file(file_path, mimetype="application/pdf")

# ================= UPLOAD =================

# BASE Code 
@app.route("/upload", methods=["POST"])
def upload():
    try:
        print("🚀 Upload started")

        # 🔐 AUTH
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Missing token"}), 401

        user_id = getIDFromToken(auth_header)
        if not user_id:
            return jsonify({"error": "Invalid token"}), 401

        # 📄 FILE CHECK
        file = request.files.get("file")
        if not file:
            return jsonify({"error": "No file uploaded"}), 400

        if file.filename == "":
            return jsonify({"error": "Empty filename"}), 400

        filename = file.filename

        # 📁 SAVE TEMP FILE
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            file.save(tmp.name)
            file_path = tmp.name

        print("📁 File saved:", file_path)

        # 📚 LOAD PDF
        loader = PyPDFLoader(file_path)
        docs = loader.load()

        if not docs:
            return jsonify({"error": "PDF read failed"}), 400

        print("📚 Pages:", len(docs))

        # ✂️ SPLIT (balanced config)
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=12000,
            chunk_overlap=1200
        )

        chunks = splitter.split_documents(docs)

        if not chunks:
            return jsonify({"error": "No content found"}), 400

        print("✂️ Total chunks:", len(chunks))

        # 🆔 DOCUMENT ID
        import uuid
        doc_id = str(uuid.uuid4())

        # 🚀 SAFE BATCH SETTINGS
        BATCH_SIZE = 10

        def embed_with_retry(text, retries=3):
            for attempt in range(retries):
                try:
                    return embedding_model.embed_query(text)
                except Exception as e:
                    print(f"⚠️ Retry {attempt+1}:", str(e))
            raise Exception("Embedding failed after retries")

        # 🚀 PROCESS IN BATCHES
        for i in range(0, len(chunks), BATCH_SIZE):
            batch = chunks[i:i + BATCH_SIZE]

            vectors = []

            for j, chunk in enumerate(batch):
                embedding = embed_with_retry(chunk.page_content)

                vectors.append({
                    "id": f"{doc_id}_{i+j}",
                    "values": embedding,
                    "metadata": {
                        "user_id": user_id,
                        "doc_id": doc_id,
                        "text": chunk.page_content
                    }
                })

            print(f"📦 Uploading batch {i//BATCH_SIZE + 1}")

            # 🚀 UPSERT WITH RETRY
            for attempt in range(3):
                try:
                    index.upsert(vectors)
                    break
                except Exception as e:
                    print(f"⚠️ Pinecone retry {attempt+1}:", str(e))
                    if attempt == 2:
                        raise e

        print("✅ All batches uploaded")

        # 💾 SAVE METADATA
        from datetime import datetime
        db.documents.insert_one({
            "doc_id": doc_id,
            "user_id": user_id,
            "filename": filename,
            "file_path": file_path,
            "uploaded_at": datetime.utcnow(),
            "chunks": len(chunks)
        })

        print("🗄️ Stored in DB")

        return jsonify({
            "message": "Document uploaded successfully",
            "doc_id": doc_id,
            "chunks": len(chunks)
        })

    except Exception as e:
        print("❌ UPLOAD ERROR:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route("/me", methods=["GET"])
def get_me():
    try:
        token=request.headers.get("Authorization")

        if not token:
            return jsonify({"error": "Token is missing!"}), 401
        token=token.split(" ")[1]

        decoded=jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id=decoded["user_id"]

        user=db.users.find_one({"_id": ObjectId(user_id)})
        return jsonify({
            "name": user.get("name", "User"),
            "email": user["email"],
            "role": user.get("role", "Member"),
            "avatar": user.get("avatar", None)
        })
    except Exception as e:
        
        return jsonify({"error": str(e)}), 401

# ================= ASK =================
@app.route("/ask", methods=["POST"])
def ask():

    # ✅ Handle CORS preflight
    #

    try:
        # 🔐 Get user from token
        auth_header = request.headers.get("Authorization")
        user_id = getIDFromToken(auth_header)

        if not user_id:
            return jsonify({"error": "Unauthorized"}), 401

        # 📥 Get request data
        data = request.json
        query = data.get("question")
        mode = data.get("mode", "strict")

        if not query:
            return jsonify({"error": "No Question provided"}), 400

        # 🔥 STEP 1: CHECK IF USER HAS DOCUMENTS
        user_docs = db.documents.find_one({"user_id": user_id})

        if not user_docs and mode=="rag":
            return jsonify({
                "answer": "⚠️ You have not uploaded any document yet. Please upload a document first."
            })

        # 🔥 STEP 2: CREATE QUERY EMBEDDING
        query_embedding = embedding_model.embed_query(query)

        # 🔥 STEP 3: QUERY PINECONE WITH STRICT FILTER
        results = index.query(
            vector=query_embedding,
            top_k=5,
            include_metadata=True,
            filter={
                "user_id": {"$eq": user_id}   # ✅ strict filter
            }
        )

        # 🔥 STEP 4: HANDLE NO MATCHES
        matches = results.get("matches", [])

        if not matches and mode=="rag" :
            return jsonify({
                "answer": "⚠️ No relevant information found in your documents."
            })

        # 🔥 STEP 5: EXTRA SAFETY FILTER (DOUBLE CHECK)
        docs = []
        for match in matches:
            metadata = match.get("metadata", {})
            if metadata.get("user_id") == user_id:
                docs.append(metadata.get("text", ""))

        if not docs and mode=="rag":
            return jsonify({
                "answer": "⚠️ No valid data found for your account."
            })

        # 📚 Build context
        context = "\n\n".join(docs)

        # 🔥 STEP 6: MODE SWITCH
        if mode == "smart":
            final_prompt = smart_prompt.invoke({
                "context": context,
                "question": query
            })
        else:
            final_prompt = strict_prompt.invoke({
                "context": context,
                "question": query
            })

        # 🤖 Generate response
        response = llm.invoke(final_prompt)

        return jsonify({
            "answer": response.content
        })

    except Exception as e:
        print("ASK ERROR:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route("/")
def home():
    return jsonify({"status": "Running"})

@app.after_request
def after_request(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    return response

