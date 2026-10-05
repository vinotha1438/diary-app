import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Auth from "./pages/Auth";
import Home from "./pages/Home";

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
      <Route path="/login" element={user ? <Navigate to="/" /> : <Auth />} />
    </Routes>
  );
}