import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";

// Paste this inside useEffect in App.jsx or directly in main.jsx

// Block right-click
document.addEventListener("contextmenu", (e) => e.preventDefault());

// Block Ctrl+C, Ctrl+U, Ctrl+S, Ctrl+A, F12
document.addEventListener("keydown", (e) => {
  const blocked =
    (e.ctrlKey && ["c", "u", "s", "a", "p"].includes(e.key.toLowerCase())) ||
    e.key === "F12" ||
    (e.ctrlKey && e.shiftKey && e.key === "I"); // DevTools
  if (blocked) e.preventDefault();
});

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <StrictMode>
      <App />
    </StrictMode>
  </BrowserRouter>,
);
