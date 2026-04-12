from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

import bcrypt
from pymongo import MongoClient
import tempfile
import os

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
CORS(app, origins=["http://localhost:5173"])

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

# ================= UPLOAD =================
@app.route("/upload", methods=["POST"])
# @token_required
def upload():
    try:
        user_id = getIDFromToken(request.headers.get("Authorization"))

        if not user_id:
            return jsonify({"error": "Missing user_id"}), 400

        file = request.files["file"]

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            file.save(tmp.name)
            path = tmp.name

        loader = PyPDFLoader(path)
        docs = loader.load()

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=150
        )

        chunks = splitter.split_documents(docs)

        # 🔥 STORE IN PINECONE (USER-SPECIFIC)
        for i, chunk in enumerate(chunks):
            embedding = embedding_model.embed_query(chunk.page_content)

            index.upsert([{
                "id": f"{user_id}_{i}",
                "values": embedding,
                "metadata": {
                    "user_id": user_id,
                    "text": chunk.page_content
                }
            }])

        os.remove(path)

        return jsonify({"message": "Document uploaded successfully"})

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
@app.route("/ask", methods=["POST"])

def ask():
    try:
        user_id = getIDFromToken(request.headers.get("Authorization"))

        if not user_id:
            return jsonify({"error": "Unauthorized"}), 401
        
        data = request.json

        query = data.get("question")
        mode = data.get("mode", "strict")

        if not query:
            return jsonify({"error": "No Question provided"}), 400

        # if not user_id:
        #     return jsonify({"error": "User not authenticated"}), 400

        query_embedding = embedding_model.embed_query(query)

        results = index.query(
            vector=query_embedding,
            top_k=5,
            include_metadata=True,
            filter={"user_id": user_id}
        )

        docs = [match["metadata"]["text"] for match in results["matches"]]

        context = "\n\n".join(docs)

        # MODE SWITCH
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


if __name__ == "__main__":
    app.run(debug=True)