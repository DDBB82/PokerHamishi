import { createContext, useContext, useState } from "react";

const CREDS_KEY = "scoresphere_credentials";
const SESSION_KEY = "scoresphere_session";

const randomPin = () => String(Math.floor(1000 + Math.random() * 9000));

// Produces the same 4-digit PIN for the same player ID on every browser
function deterministicPin(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = Math.imul(31, hash) + id.charCodeAt(i) | 0;
  }
  return String(1000 + Math.abs(hash) % 9000);
}

function loadCredentials() {
  try {
    const players = JSON.parse(localStorage.getItem("scoresphere_players") || "[]");
    const existing = JSON.parse(localStorage.getItem(CREDS_KEY) || "[]");

    // Always build from players list, preserving any existing passwords/roles
    const merged = players.map((p) => {
      const found = existing.find((c) => c.id === p.id);
      if (found) return found;
      if (p.name === "Beck") {
        return { id: p.id, name: p.name, password: "6541", isAdmin: true, isSuperAdmin: true };
      }
      return { id: p.id, name: p.name, password: deterministicPin(p.id) };
    });

    localStorage.setItem(CREDS_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return [];
  }
}

function saveCreds(creds) {
  localStorage.setItem(CREDS_KEY, JSON.stringify(creds));
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [credentials, setCredentials] = useState(loadCredentials);
  const [currentUser, setCurrentUser] = useState(loadSession);
  // Auto-open on first visit if not already logged in
  const [loginModalOpen, setLoginModalOpen] = useState(() => loadSession() === null);

  function login(name, password) {
    const cred = credentials.find(
      (c) => c.name.toLowerCase() === name.toLowerCase() && c.password === password
    );
    if (!cred) return false;
    const user = { id: cred.id, name: cred.name, isAdmin: !!cred.isAdmin };
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    setCurrentUser(user);
    return true;
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
  }

  function addCredential(id, name) {
    const next = [...credentials, { id, name, password: deterministicPin(id) }];
    saveCreds(next);
    setCredentials(next);
  }

  function removeCredential(id) {
    const next = credentials.filter((c) => c.id !== id);
    saveCreds(next);
    setCredentials(next);
    // Log out if the removed user is currently logged in
    if (currentUser?.id === id) logout();
  }

  function resetPin(id) {
    const next = credentials.map((c) => (c.id === id ? { ...c, password: randomPin() } : c));
    saveCreds(next);
    setCredentials(next);
  }

  function toggleAdmin(id) {
    const next = credentials.map((c) => {
      if (c.id !== id || c.isSuperAdmin) return c;
      return { ...c, isAdmin: !c.isAdmin };
    });
    saveCreds(next);
    setCredentials(next);
    // Update live session if affected user is logged in
    if (currentUser?.id === id) {
      const updated = next.find((c) => c.id === id);
      if (updated) {
        const user = { id: updated.id, name: updated.name, isAdmin: !!updated.isAdmin };
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        setCurrentUser(user);
      }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        credentials,
        loginModalOpen,
        login,
        logout,
        openLogin: () => setLoginModalOpen(true),
        closeLogin: () => setLoginModalOpen(false),
        addCredential,
        removeCredential,
        resetPin,
        toggleAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
