import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function LoginModal() {
  const { loginModalOpen, closeLogin, login, credentials } = useAuth();
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");

  if (!loginModalOpen) return null;

  function handleClose() {
    setName(""); setPin(""); setErr("");
    closeLogin();
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!name) { setErr("Please select a player."); return; }
    const ok = login(name, pin);
    if (ok) {
      handleClose();
    } else {
      setErr("Incorrect PIN.");
      setPin("");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 w-full max-w-sm mx-4">
        <h2 className="text-xl font-bold text-slate-800 mb-1 text-center">🃏 פוקר חמישי</h2>
        <p className="text-sm text-slate-400 text-center mb-6">Sign in to track your stats</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Player</label>
            <select
              value={name}
              onChange={(e) => { setName(e.target.value); setErr(""); }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">— select player —</option>
              {credentials.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setErr(""); }}
              placeholder="4-digit PIN"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          {err && <p className="text-red-500 text-sm">{err}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              Continue as Guest
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
