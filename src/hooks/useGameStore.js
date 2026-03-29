import { useState, useMemo } from "react";
import { INITIAL_PLAYERS, INITIAL_GAMES, INITIAL_HOSTING } from "../data/initialData";

const KEYS = {
  players:  "scoresphere_players",
  games:    "scoresphere_games",
  hosting:  "scoresphere_hosting",
  rsvps:    "scoresphere_rsvps",
  sessions: "scoresphere_sessions",
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(KEYS.players);
    if (!raw) {
      localStorage.setItem(KEYS.players,   JSON.stringify(INITIAL_PLAYERS));
      localStorage.setItem(KEYS.games,     JSON.stringify(INITIAL_GAMES));
      localStorage.setItem(KEYS.hosting,   JSON.stringify(INITIAL_HOSTING));
      localStorage.setItem(KEYS.rsvps,     JSON.stringify([]));
      localStorage.setItem(KEYS.sessions,  JSON.stringify([]));
      return { players: INITIAL_PLAYERS, games: INITIAL_GAMES, hosting: INITIAL_HOSTING, rsvps: [], sessions: [] };
    }
    return {
      players:  JSON.parse(localStorage.getItem(KEYS.players))  || [],
      games:    JSON.parse(localStorage.getItem(KEYS.games))    || [],
      hosting:  JSON.parse(localStorage.getItem(KEYS.hosting))  || [],
      rsvps:    JSON.parse(localStorage.getItem(KEYS.rsvps))    || [],
      sessions: JSON.parse(localStorage.getItem(KEYS.sessions)) || [],
    };
  } catch {
    return { players: INITIAL_PLAYERS, games: INITIAL_GAMES, hosting: INITIAL_HOSTING, rsvps: [], sessions: [] };
  }
}

function computeHostingStatus(entries) {
  const now = new Date();
  const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
  let nextAssigned = false;
  return sorted.map((entry) => {
    const d = new Date(entry.date);
    if (d < now) return { ...entry, status: "past" };
    if (!nextAssigned) { nextAssigned = true; return { ...entry, status: "next" }; }
    return { ...entry, status: "upcoming" };
  });
}

export function useGameStore() {
  const [store, setStore] = useState(() => loadFromStorage());

  function persist(next) {
    localStorage.setItem(KEYS.players,  JSON.stringify(next.players));
    localStorage.setItem(KEYS.games,    JSON.stringify(next.games));
    localStorage.setItem(KEYS.hosting,  JSON.stringify(next.hosting));
    localStorage.setItem(KEYS.rsvps,    JSON.stringify(next.rsvps));
    localStorage.setItem(KEYS.sessions, JSON.stringify(next.sessions));
    setStore(next);
  }

  // ── Players ───────────────────────────────────────────────────────────────
  function addPlayer(name, photoBase64 = null) {
    const player = { id: generateId(), name: name.trim(), photoBase64 };
    persist({ ...store, players: [...store.players, player] });
    return player;
  }

  function removePlayer(id) {
    persist({ ...store, players: store.players.filter((p) => p.id !== id) });
  }

  function updatePlayerPhoto(id, photoBase64) {
    persist({
      ...store,
      players: store.players.map((p) => (p.id === id ? { ...p, photoBase64 } : p)),
    });
  }

  function updatePlayerName(id, name) {
    persist({
      ...store,
      players: store.players.map((p) => (p.id === id ? { ...p, name: name.trim() } : p)),
    });
  }

  // ── Games ─────────────────────────────────────────────────────────────────
  function addGame({ date, hostName, scores }) {
    const game = { id: generateId(), date, hostName, scores };
    persist({ ...store, games: [...store.games, game] });
  }

  function updateGame(id, { date, hostName, scores }) {
    persist({
      ...store,
      games: store.games.map((g) => (g.id === id ? { ...g, date, hostName, scores } : g)),
    });
  }

  function deleteGame(id) {
    persist({ ...store, games: store.games.filter((g) => g.id !== id) });
  }

  function addGamePhoto(gameId, photoBase64) {
    persist({
      ...store,
      games: store.games.map((g) =>
        g.id === gameId ? { ...g, photos: [...(g.photos || []), photoBase64] } : g
      ),
    });
  }

  function removeGamePhoto(gameId, photoIndex) {
    persist({
      ...store,
      games: store.games.map((g) =>
        g.id === gameId
          ? { ...g, photos: (g.photos || []).filter((_, i) => i !== photoIndex) }
          : g
      ),
    });
  }

  // ── Hosting ───────────────────────────────────────────────────────────────
  function addHostEntry({ date, playerName }) {
    const entry = { id: generateId(), date, playerName };
    persist({ ...store, hosting: [...store.hosting, entry] });
  }

  function updateHostEntry(id, { date, playerName }) {
    persist({
      ...store,
      hosting: store.hosting.map((h) => (h.id === id ? { ...h, date, playerName } : h)),
    });
  }

  function deleteHostEntry(id) {
    persist({ ...store, hosting: store.hosting.filter((h) => h.id !== id) });
  }

  function toggleRsvpOpen(hostingId) {
    persist({
      ...store,
      hosting: store.hosting.map((h) =>
        h.id === hostingId ? { ...h, rsvpOpen: !(h.rsvpOpen ?? false) } : h
      ),
    });
  }

  // ── RSVPs ─────────────────────────────────────────────────────────────────
  function setRsvp(hostingId, playerId, playerName, status) {
    const existing = store.rsvps.findIndex(
      (r) => r.hostingId === hostingId && r.playerId === playerId
    );
    let updatedRsvps;
    if (existing !== -1) {
      updatedRsvps = store.rsvps.map((r, i) =>
        i === existing ? { ...r, playerName, status } : r
      );
    } else {
      updatedRsvps = [
        ...store.rsvps,
        { id: generateId(), hostingId, playerId, playerName, status },
      ];
    }
    persist({ ...store, rsvps: updatedRsvps });
  }

  function removeRsvp(hostingId, playerId) {
    persist({
      ...store,
      rsvps: store.rsvps.filter(
        (r) => !(r.hostingId === hostingId && r.playerId === playerId)
      ),
    });
  }

  // ── Sessions ──────────────────────────────────────────────────────────────
  function createSession(hostingId) {
    const session = {
      id: generateId(),
      hostingId,
      status: "waiting",
      players: [],
      rebuyRequests: [],
    };
    persist({ ...store, sessions: [...store.sessions, session] });
  }

  function startSession(sessionId) {
    persist({
      ...store,
      sessions: store.sessions.map((s) =>
        s.id === sessionId ? { ...s, status: "active" } : s
      ),
    });
  }

  function checkInToSession(sessionId, playerId, playerName) {
    persist({
      ...store,
      sessions: store.sessions.map((s) => {
        if (s.id !== sessionId) return s;
        if (s.players.some((p) => p.playerId === playerId)) return s;
        return { ...s, players: [...s.players, { playerId, playerName, buys: 1 }] };
      }),
    });
  }

  function requestRebuy(sessionId, playerId, playerName) {
    const request = {
      id: generateId(),
      playerId,
      playerName,
      timestamp: Date.now(),
      status: "pending",
    };
    persist({
      ...store,
      sessions: store.sessions.map((s) =>
        s.id === sessionId
          ? { ...s, rebuyRequests: [...s.rebuyRequests, request] }
          : s
      ),
    });
  }

  function approveRebuy(sessionId, requestId) {
    persist({
      ...store,
      sessions: store.sessions.map((s) => {
        if (s.id !== sessionId) return s;
        const req = s.rebuyRequests.find((r) => r.id === requestId);
        if (!req) return s;
        return {
          ...s,
          rebuyRequests: s.rebuyRequests.map((r) =>
            r.id === requestId ? { ...r, status: "approved" } : r
          ),
          players: s.players.map((p) =>
            p.playerId === req.playerId ? { ...p, buys: p.buys + 1 } : p
          ),
        };
      }),
    });
  }

  function denyRebuy(sessionId, requestId) {
    persist({
      ...store,
      sessions: store.sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              rebuyRequests: s.rebuyRequests.map((r) =>
                r.id === requestId ? { ...r, status: "denied" } : r
              ),
            }
          : s
      ),
    });
  }

  function endSession(sessionId) {
    persist({
      ...store,
      sessions: store.sessions.map((s) =>
        s.id === sessionId ? { ...s, status: "ended" } : s
      ),
    });
  }

  // ── Computed ──────────────────────────────────────────────────────────────
  const hostingWithStatus = useMemo(
    () => computeHostingStatus(store.hosting),
    [store.hosting]
  );

  return {
    players:  store.players,
    games:    store.games,
    hosting:  hostingWithStatus,
    rsvps:    store.rsvps,
    sessions: store.sessions,
    // mutations
    addPlayer,
    removePlayer,
    updatePlayerPhoto,
    updatePlayerName,
    addGame,
    updateGame,
    deleteGame,
    addGamePhoto,
    removeGamePhoto,
    addHostEntry,
    updateHostEntry,
    deleteHostEntry,
    toggleRsvpOpen,
    setRsvp,
    removeRsvp,
    createSession,
    startSession,
    checkInToSession,
    requestRebuy,
    approveRebuy,
    denyRebuy,
    endSession,
  };
}
