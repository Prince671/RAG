from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from flask import send_file

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

SECRET_KEY=os.getenv("JWT_SCRET_KEY")  # Use a secure secret key in production


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
@app.route("/register", methods=["POST", "OPTIONS"])
def register():
    if request.method=="OPTIONS":
        return {"message": "OK"}, 200
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

@app.route("/login", methods=["POST", "OPTIONS"])
def login():
    if request.method=="OPTIONS":
        return {"message": "OK"}, 200
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
    except:
        return None




@app.route("/documents", methods=["GET", "OPTIONS"])

def get_documents():

    if request.method=="OPTIONS":
        return {"message": "OK"}, 200

    user_id = getIDFromToken(request.headers.get("Authorization"))

    docs = list(db.documents.find({"user_id": user_id}, {"_id": 0}))

    return jsonify(docs)


@app.route("/documents/<doc_id>", methods=["DELETE", "OPTIONS"])

def delete_document(doc_id):

    if request.method=="OPTIONS":
        return {"message": "OK"}, 200

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




@app.route("/documents/preview/<doc_id>", methods=["GET", "OPTIONS"])
def preview_document(doc_id):
    if request.method=="OPTIONS":
        return {"message": "OK"}, 200
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


@app.route("/upload", methods=["POST", "OPTIONS"])
def upload():

    # ✅ Handle CORS preflight
    if request.method == "OPTIONS":
        return {"message": "OK"}, 200

    try:
        # 🔐 Extract user_id from token
        auth_header = request.headers.get("Authorization")
        user_id = getIDFromToken(auth_header)

        if not user_id:
            return jsonify({"error": "Missing user_id"}), 400

        # 📄 Get file
        file = request.files.get("file")
        if not file:
            return jsonify({"error": "No file uploaded"}), 400

        filename = file.filename

        # 📁 Save temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            file.save(tmp.name)
            path = tmp.name

        # 📚 Load + split
        loader = PyPDFLoader(path)
        docs = loader.load()

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=150
        )
        chunks = splitter.split_documents(docs)

        # 🔥 CREATE UNIQUE DOCUMENT ID
        doc_id = str(uuid.uuid4())

        # 🚀 BATCH UPSERT (FASTER)
        vectors = []

        for i, chunk in enumerate(chunks):
            embedding = embedding_model.embed_query(chunk.page_content)

            vectors.append({
                "id": f"{doc_id}_{i}",   # ✅ unique per document
                "values": embedding,
                "metadata": {
                    "user_id": user_id,
                    "doc_id": doc_id,    # 🔥 IMPORTANT
                    "text": chunk.page_content
                }
            })

        # 🔥 Upload all at once (FASTER)
        index.upsert(vectors)
        file_path=path
        # 💾 SAVE DOCUMENT METADATA (MongoDB)
        db.documents.insert_one({
            "doc_id": doc_id,
            "user_id": user_id,
            "filename": filename,
            "file_path":file_path,
            "uploaded_at": datetime.utcnow(),
            "chunks": len(chunks)
        })

        # 🧹 Clean temp file
        os.remove(path)

        return jsonify({
            "message": "Document uploaded successfully",
            "doc_id": doc_id,
            "chunks": len(chunks)
        })

    except Exception as e:
        print("UPLOAD ERROR:", str(e))
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
@app.route("/ask", methods=["POST", "OPTIONS"])
def ask():

    # ✅ Handle CORS preflight
    if request.method == "OPTIONS":
        return {"message": "OK"}, 200

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

        if not user_docs:
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

        if not matches:
            return jsonify({
                "answer": "⚠️ No relevant information found in your documents."
            })

        # 🔥 STEP 5: EXTRA SAFETY FILTER (DOUBLE CHECK)
        docs = []
        for match in matches:
            metadata = match.get("metadata", {})
            if metadata.get("user_id") == user_id:
                docs.append(metadata.get("text", ""))

        if not docs:
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

