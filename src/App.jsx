import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GameStoreProvider } from "./context/GameStoreContext";
import { AuthProvider } from "./context/AuthContext";
import LoginModal from "./components/LoginModal";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Players from "./pages/Players";
import Games from "./pages/Games";
import Hosting from "./pages/Hosting";
import Statistics from "./pages/Statistics";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <AuthProvider>
      <GameStoreProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-slate-100 flex flex-col">
            <Navbar />
            <LoginModal />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
              <Routes>
                <Route path="/" element={<Navigate to="/Dashboard" replace />} />
                <Route path="/Dashboard" element={<Dashboard />} />
                <Route path="/Players" element={<Players />} />
                <Route path="/Games" element={<Games />} />
                <Route path="/Hosting" element={<Hosting />} />
                <Route path="/Statistics" element={<Statistics />} />
                <Route path="/Admin" element={<Admin />} />
                <Route path="*" element={<Navigate to="/Dashboard" replace />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </GameStoreProvider>
    </AuthProvider>
  );
}
