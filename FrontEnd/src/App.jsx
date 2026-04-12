import { Link } from "react-router-dom";
import "./App.css";
import Home from "./components/Home";
import { Routes } from "react-router-dom";
import { Route } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Toast from "./components/Toast";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";

function App() {
  return (
    <>
      <Toast />
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
