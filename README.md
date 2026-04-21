# 🚀 AI RAG Assistant (Flask + React + Pinecone + Mistral)

An intelligent **Retrieval-Augmented Generation (RAG)** web application that allows users to:

* 📄 Upload & manage PDF documents
* 🤖 Ask questions based on uploaded documents
* 🧠 Get AI-generated answers using document context
* 🎤 Use voice input for queries
* 🔐 Secure authentication system

Built using **Flask (Backend)** and **React (Frontend)** with **Pinecone Vector DB** and **Mistral AI**.

---

# ✨ Features

## 🔐 Authentication

* User registration & login
* JWT-based authentication
* Secure API access

---

## 📄 Document Management

* Upload PDF documents
* View uploaded documents
* Delete documents (removes from Pinecone + MongoDB)
* File preview support

---

## 🧠 RAG Processing

* Automatic text chunking
* Embeddings using Mistral AI
* Vector storage in Pinecone
* Strict user-based filtering (no data leakage between users)

---

## 🤖 AI Chat Modes

### 🔹 Strict Mode
* Answers ONLY from uploaded document context
* No hallucination

### 🔹 Smart Mode
* Uses document + AI knowledge
* More flexible answers

---

## 🎤 Voice Input

* Speak your query instead of typing
* Speech-to-text integration
* Seamless chat interaction

---

## 🧾 Response Enhancements

* Clean formatted responses
  - Headings
  - Bullet points
  - Code blocks
* 📋 Copy response button
* Improved readability UI

---

## 📱 Mobile Support

* Works on mobile devices (same network)
* Fully responsive UI

---

# 🧱 Tech Stack

## 🔹 Frontend

* React (Vite)
* Tailwind CSS
* Axios

## 🔹 Backend

* Flask
* Flask-CORS
* PyJWT

## 🔹 AI & RAG

* LangChain
* Mistral AI (LLM + Embeddings)
* Recursive Text Splitter

## 🔹 Database

* MongoDB (Users & Documents)
* Pinecone (Vector Database)

---

# ⚙️ Installation & Setup

## 1️⃣ Clone Repository

```bash
git clone https://github.com/Prince671/RAG.git
cd RAG


---

2️⃣ Backend Setup

cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt

Create .env file:

MONGO_URI=your_mongodb_url
PINECONE_API_KEY=your_pinecone_key
JWT_SECRET_KEY=your_secret_key

Run Backend:

python app.py


---

3️⃣ Frontend Setup

cd frontend
npm install

Create .env:

VITE_API_URL=http://localhost:5000

Run Frontend:

npm run dev


---

🌐 Run on Mobile (Same WiFi)

1. Find your IP:



ipconfig

2. Run frontend:



npm run dev -- --host

3. Update API URL:



VITE_API_URL=http://121.0.0.0:5000




---

📡 API Endpoints

🔐 Auth

POST /register

POST /login



---

📄 Documents

POST /upload → Upload PDF

GET /documents → Get all documents

DELETE /documents/:id → Delete document

DELETE /documents/all → Delete all documents

GET /documents/preview/:id → Preview file



---

💬 Chat

POST /ask → Ask question (RAG + Smart Mode)



---

📂 Project Structure

rag-ai-assistant/
│
├── backend/
│   ├── app.py
│   ├── requirements.txt
│
├── frontend/
│   ├── src/
│     ├── components/
│   
│
└── README.md


---

⚡ Performance Optimizations

Batch embedding generation

Single Pinecone upsert (faster)

Optimized chunking strategy

Efficient filtering per user



---

🚀 Future Improvements

📊 Upload progress indicator

🌍 Deployment (Vercel + Render)

🧠 Chat history & memory

🎤 Continuous voice mode (Jarvis-style)



---

🤝 Contributing

Pull requests are welcome!
For major changes, open an issue first.


---

📜 License

This project is open-source under the MIT License.


---

👨‍💻 Author

Prince Soni
🚀 Passionate about AI, Full Stack & Generative AI


---
