<div align="center">

# 🤖 AI RAG Assistant

### Intelligent Document Q&A Powered by Mistral AI + Pinecone

[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![Flask](https://img.shields.io/badge/Flask-3.0+-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0+-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Pinecone](https://img.shields.io/badge/Pinecone-Vector%20DB-00B388?style=for-the-badge)](https://pinecone.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<br/>

**Upload PDFs → Ask Questions → Get AI-Powered Answers**

A full-stack Retrieval-Augmented Generation (RAG) application that lets you chat with your documents intelligently — with strict per-user data isolation and zero hallucination in strict mode.

[Features](#-features) · [Tech Stack](#-tech-stack) · [Quick Start](#-quick-start) · [API Reference](#-api-reference) · [Roadmap](#-roadmap)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Mobile Access](#-mobile-access-same-wifi)
- [Performance Optimizations](#-performance-optimizations)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [Author](#-author)
- [License](#-license)

---

## 🌟 Overview

AI RAG Assistant is a production-ready web application that bridges the gap between your private documents and powerful AI. Instead of generic AI responses, you get answers grounded in your actual uploaded content — with strict per-user data isolation ensuring no information leaks between accounts.

**How it works:**

```
User uploads PDF
       ↓
Text is chunked + embedded via Mistral AI
       ↓
Vectors stored in Pinecone (tagged to user)
       ↓
User asks a question
       ↓
Relevant chunks retrieved from Pinecone
       ↓
Mistral LLM generates a grounded answer
       ↓
Formatted response displayed in UI
```

---

## ✨ Features

### 🔐 Authentication & Security
- User registration and login with hashed passwords
- JWT-based stateless authentication
- Per-user namespace isolation in Pinecone (no data leakage between users)
- Secure API access on all protected routes

### 📄 Document Management
| Feature | Description |
|---|---|
| Upload PDFs | Drag & drop or browse to upload documents |
| View Documents | See all your uploaded documents in one place |
| Delete Single | Remove a document from DB + Pinecone vectors |
| Delete All | Bulk clear all your documents at once |
| File Preview | Preview documents directly in the browser |

### 🧠 RAG Engine
- **Automatic text chunking** using LangChain's `RecursiveCharacterTextSplitter`
- **Mistral AI embeddings** for high-quality semantic search
- **Pinecone vector storage** with metadata-based user filtering
- **Batch upserts** for fast, efficient indexing

### 🤖 Dual Chat Modes

| Mode | Behavior | Best For |
|---|---|---|
| 🔹 **Strict Mode** | Answers ONLY from your uploaded documents. No hallucination. | Legal, compliance, precise Q&A |
| 🔸 **Smart Mode** | Blends document context with Mistral's general knowledge | Research, exploration, open-ended questions |

### 🎤 Voice Input
- Speak your query instead of typing
- Browser-native Speech-to-Text integration
- Seamlessly populates the chat input field

### 🧾 Response Formatting
- Markdown rendering (headings, bullet points, code blocks)
- One-click **Copy Response** button
- Clean, readable chat UI with message history

### 📱 Mobile Support
- Fully responsive React UI (Tailwind CSS)
- Works on mobile devices connected to the same WiFi network

---

## 🧱 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** (Vite) | UI framework with fast HMR dev server |
| **Tailwind CSS** | Utility-first styling |
| **Axios** | HTTP client for API calls |

### Backend
| Technology | Purpose |
|---|---|
| **Flask** | Python web framework |
| **Flask-CORS** | Cross-origin resource sharing |
| **PyJWT** | JWT token generation & validation |

### AI & RAG Pipeline
| Technology | Purpose |
|---|---|
| **Mistral AI** | LLM for answer generation + text embeddings |
| **LangChain** | Document loading, text splitting, RAG orchestration |
| **Pinecone** | Cloud vector database for semantic search |

### Database
| Technology | Purpose |
|---|---|
| **MongoDB** | User accounts and document metadata |
| **Pinecone** | Vector embeddings with per-user filtering |

---

## 📂 Project Structure

```
rag-ai-assistant/
│
├── backend/
│   ├── app.py                  # Main Flask application & API routes
│   ├── requirements.txt        # Python dependencies
│   └── .env                    # Environment variables (not committed)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/           # Login & Register components
│   │   │   ├── Chat/           # Chat interface & message rendering
│   │   │   ├── Documents/      # Document upload, list & management
│   │   │   └── Layout/         # Navbar, sidebar, shared UI
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env                    # Frontend environment variables
│   ├── index.html
│   └── package.json
│
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

Make sure you have the following installed:
- Python 3.9+
- Node.js 18+
- A MongoDB instance (local or [Atlas](https://cloud.mongodb.com))
- A [Pinecone](https://pinecone.io) account (free tier works)
- A [Mistral AI](https://console.mistral.ai) API key

### 1. Clone the Repository

```bash
git clone https://github.com/Prince671/RAG.git
cd RAG
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:

```env
MONGO_URI=your_mongodb_connection_string
PINECONE_API_KEY=your_pinecone_api_key
MISTRAL_API_KEY=your_mistral_api_key
JWT_SECRET_KEY=your_super_secret_jwt_key
```

Start the backend server:

```bash
python app.py
# Server runs at http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000
```

Start the development server:

```bash
npm run dev
# App runs at http://localhost:5173
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Required |
|---|---|---|
| `MONGO_URI` | MongoDB connection string | ✅ |
| `PINECONE_API_KEY` | Pinecone API key | ✅ |
| `MISTRAL_API_KEY` | Mistral AI API key | ✅ |
| `JWT_SECRET_KEY` | Secret key for signing JWT tokens | ✅ |

### Frontend (`frontend/.env`)

| Variable | Description | Required |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | ✅ |

> ⚠️ **Never commit `.env` files to version control.** Both are included in `.gitignore`.

---

## 📡 API Reference

### 🔐 Authentication

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/register` | Register a new user | ❌ |
| `POST` | `/login` | Login and receive JWT token | ❌ |

**Register Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Login Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5...",
  "user": { "id": "...", "username": "john_doe" }
}
```

---

### 📄 Documents

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/upload` | Upload a PDF document | ✅ |
| `GET` | `/documents` | List all user documents | ✅ |
| `DELETE` | `/documents/:id` | Delete a specific document | ✅ |
| `DELETE` | `/documents/all` | Delete all user documents | ✅ |
| `GET` | `/documents/preview/:id` | Preview a document in browser | ✅ |

All document endpoints use `Authorization: Bearer <token>` in the request header.

---

### 💬 Chat

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/ask` | Ask a question (supports both modes) | ✅ |

**Request Body:**
```json
{
  "question": "What are the key findings in chapter 3?",
  "mode": "strict"
}
```

**Response:**
```json
{
  "answer": "Based on your uploaded document...",
  "sources": ["chunk_id_1", "chunk_id_2"]
}
```

> `mode` accepts `"strict"` or `"smart"`.

---

## 📱 Mobile Access (Same WiFi)

To access the app from a phone or tablet on the same network:

**1. Find your local IP address:**
```bash
# Windows
ipconfig

# macOS / Linux
ifconfig
```

**2. Start the frontend with host flag:**
```bash
npm run dev -- --host
```

**3. Update your frontend `.env`:**
```env
VITE_API_URL=http://<YOUR_LOCAL_IP>:5000
```

**4. Open on your phone:**
```
http://<YOUR_LOCAL_IP>:5173
```

---

## ⚡ Performance Optimizations

- **Batch embedding generation** — embeddings created in batches rather than one-by-one
- **Single Pinecone upsert** — entire document indexed in one API call for speed
- **Optimized chunking strategy** — chunk size and overlap tuned for context quality
- **Efficient user filtering** — metadata-based namespace filtering in Pinecone queries prevents full-index scans
- **JWT stateless auth** — no session lookups; token validation is O(1)

---

## 🗺️ Roadmap

- [ ] 📊 Upload progress bar with real-time status
- [ ] 🌍 Deployment guide (Vercel + Render / Railway)
- [ ] 🧠 Persistent chat history per document
- [ ] 🎤 Continuous voice mode (Jarvis-style hands-free)
- [ ] 🗂️ Multi-document chat (query across several PDFs at once)
- [ ] 📧 Email-based password reset
- [ ] 🐳 Docker + Docker Compose support
- [ ] 📊 Usage analytics dashboard

---

## 🤝 Contributing

Contributions are welcome and appreciated!

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/your-feature-name`
3. **Commit** your changes: `git commit -m 'feat: add some feature'`
4. **Push** to your branch: `git push origin feature/your-feature-name`
5. **Open** a Pull Request

> For major changes, please open an issue first to discuss what you'd like to change.

---

## 👨‍💻 Author

**Prince Soni**

Passionate about AI, Full Stack Development & Generative AI

[![GitHub](https://img.shields.io/badge/GitHub-Prince671-181717?style=flat-square&logo=github)](https://github.com/Prince671)

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).

---

<div align="center">

⭐ **If this project helped you, consider giving it a star!** ⭐

Made with ❤️ by Prince Soni

</div>
