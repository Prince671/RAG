# 🚀 AI RAG Assistant (Flask + React + Pinecone + Mistral)

An intelligent **Retrieval-Augmented Generation (RAG)** web application that allows users to:

* 📄 Upload PDF documents
* 🤖 Ask questions based on uploaded documents
* 🧠 Get AI-generated answers using document context
* 🔐 Secure login & registration system

Built using **Flask (Backend)** and **React (Frontend)** with **Pinecone Vector DB** and **Mistral AI**.

---

# ✨ Features

## 🔐 Authentication

* User registration & login
* JWT-based authentication
* Secure API access

## 📄 Document Upload

* Upload PDF documents
* Automatic text chunking
* Generate embeddings using Mistral
* Store vectors in Pinecone

## 🤖 AI Chat (RAG + Smart Mode)

* **Strict Mode** → Answers ONLY from document context
* **Smart Mode** → Uses document + AI knowledge
* Clean structured responses (headings, bullets, code)

## 📱 Mobile Support

* Accessible on mobile (same network)
* Responsive UI

---

# 🧱 Tech Stack

## 🔹 Frontend

* React (Vite)
* Tailwind CSS
* Axios

## 🔹 Backend

* Flask
* Flask-CORS
* JWT (PyJWT)

## 🔹 AI & RAG

* LangChain
* Mistral AI (LLM + Embeddings)
* Recursive Text Splitter

## 🔹 Database

* MongoDB (Users)
* Pinecone (Vector Database)

---

# ⚙️ Installation & Setup

## 1️⃣ Clone Repository

```bash
git clone https://github.com/Prince671/RAG.git
cd RAG
```

---

## 2️⃣ Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

### Create `.env` file:

```env
MONGO_URI=your_mongodb_url
PINECONE_API_KEY=your_pinecone_key
JWT_SECRET_KEY=your_secret_key
```

### Run Backend:

```bash
python app.py
```

---

## 3️⃣ Frontend Setup

```bash
cd frontend
npm install
```

### Create `.env`:

```env
VITE_API_URL=http://localhost:5000
```

### Run Frontend:

```bash
npm run dev
```

---

# 🌐 Run on Mobile (Same WiFi)

1. Find your IP:

```bash
ipconfig
```

2. Run frontend:

```bash
npm run dev -- --host
```

3. Update API URL:

```env
VITE_API_URL=http://192.168.X.X:5000
```

4. Open on phone:

```
http://192.168.X.X:5173
```

---

# 📡 API Endpoints

## 🔐 Auth

* `POST /register`
* `POST /login`

## 📄 Documents

* `POST /upload`

## 💬 Chat

* `POST /ask`

---

# 📂 Project Structure

```
rag-ai-assistant/
│
├── backend/
│   ├── app.py
│   ├── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│
└── README.md
```

---

# ⚡ Performance Optimizations

* Batch embeddings for faster processing
* Single Pinecone upsert (optimized API calls)
* Efficient chunking strategy

---

# 🚀 Future Improvements

* 📊 Upload progress tracking
* 🌍 Deployment (Vercel + Render)

---

# 🤝 Contributing

Pull requests are welcome!
For major changes, open an issue first.

---

# 📜 License

This project is open-source under the MIT License.

---

# 👨‍💻 Author

**Prince Soni**
🚀 Passionate about AI, Full Stack & Generative AI

---

# ⭐ Support

If you like this project:

👉 Star the repo
👉 Share with others
👉 Build something amazing 🚀
