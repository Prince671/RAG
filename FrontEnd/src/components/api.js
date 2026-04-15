import axios from "axios";

// ✅ BASE URL
const BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 300000,
});

// ─────────────────────────────────────────────
// 🔐 REQUEST INTERCEPTOR (AUTO ATTACH TOKEN)
// ─────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // ✅ FIXED (space added)
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────
// ⚠️ RESPONSE INTERCEPTOR (AUTO LOGOUT)
// ─────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (error) => {
    console.error("API ERROR:", error.response?.data || error.message);

    if (error.response?.status === 401) {
      localStorage.removeItem("token");

      localStorage.setItem(
        "toast",
        JSON.stringify({
          type: "info",
          message: "Session expired. Please login again.",
        })
      );

      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────
// 🔐 AUTH
// ─────────────────────────────────────────────

export const login = async (email, password) => {
  const res = await api.post("/login", { email, password });

  localStorage.setItem("user_id", res.data.user_id);
  localStorage.setItem("token", res.data.token);

  if (res.data.name) {
    localStorage.setItem("name", res.data.name);
  }

  return res.data;
};

export const register = async (name, email, password) => {
  const res = await api.post("/register", { name, email, password });
  return res.data;
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("name");
};

// ─────────────────────────────────────────────
// 📄 UPLOAD DOCUMENT
// ─────────────────────────────────────────────
export const uploadDocument = (file, onUploadProgress) => {
  const form = new FormData();
  form.append("file", file);

  return api.post("/upload", form, {
    // ❌ DO NOT ADD Content-Type
    onUploadProgress,
  });
};

// ─────────────────────────────────────────────
// 📄 DOCUMENTS
// ─────────────────────────────────────────────
export const getDocuments = () => api.get("/documents");

export const deleteDocument = (docId) =>
  api.delete(`/documents/${docId}`);

export const getMe = () => api.get("/me");

// ─────────────────────────────────────────────
// 💬 ASK QUESTION
// ─────────────────────────────────────────────
export const askQuestion = (question, mode = "strict") => {
  return api.post("/ask", {
    question,
    mode,
  });
};

export default api;
