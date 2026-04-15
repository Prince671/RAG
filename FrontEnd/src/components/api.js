import axios from "axios";

// ✅ BASE URL
const BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
baseURL: BASE_URL,
timeout: 300000,
});

// ─────────────────────────────────────────────
// 🔐 REQUEST INTERCEPTOR (ATTACH JWT TOKEN)
// ─────────────────────────────────────────────
api.interceptors.request.use(
(config) => {
const token = localStorage.getItem("token");

if (token) {  
  config.headers.Authorization = `Bearer ${token}`;  
}  

return config;

},
(error) => Promise.reject(error)
);

export const getDocuments = () => api.get("/documents");

export const deleteDocument = (docId) =>
api.delete(/documents/${docId});

// ─────────────────────────────────────────────
// ⚠️ RESPONSE INTERCEPTOR (AUTO LOGOUT)
// ─────────────────────────────────────────────
api.interceptors.response.use(
(res) => res,
(error) => {
console.error("API ERROR:", error.response?.data || error.message);

// 🔥 AUTO LOGOUT ON TOKEN EXPIRE  
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

// ✅ LOGIN
export const login = async (email, password) => {
const res = await api.post(
"/login",
{ email, password },
{ headers: { "Content-Type": "application/json" } }
);

// 🔥 SAVE JWT TOKEN
localStorage.setItem("user_id", res.data.user_id);
localStorage.setItem("token", res.data.token);

// optional
if (res.data.name) {
localStorage.setItem("name", res.data.name);
}

return res.data;
};

// ✅ REGISTER (NOW WITH NAME)
export const register = async (name, email, password) => {
const res = await api.post(
"/register",
{ name, email, password },
{ headers: { "Content-Type": "application/json" } }
);

return res.data;
};

// ✅ LOGOUT
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
headers: {
"Content-Type": "multipart/form-data",
},
onUploadProgress,
});
};

export const getMe=()=>{
const token=localStorage.getItem("token");

return api.get("/me",{
headers:{
Authorization:Bearer ${token}
}
});
}

// ─────────────────────────────────────────────
// 💬 ASK QUESTION
// ─────────────────────────────────────────────
export const askQuestion = (question, mode = "strict") => {
return api.post("/ask", {
question,
mode, // "strict" or "smart"
});
};

export default api;

