import { useState, useMemo } from "react";
import { INITIAL_PLAYERS, INITIAL_GAMES, INITIAL_HOSTING } from "../data/initialData";

const KEYS = {
  players: "scoresphere_players",
  games:   "scoresphere_games",
  hosting: "scoresphere_hosting",
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(KEYS.players);
    if (!raw) {
      localStorage.setItem(KEYS.players, JSON.stringify(INITIAL_PLAYERS));
      localStorage.setItem(KEYS.games,   JSON.stringify(INITIAL_GAMES));
      localStorage.setItem(KEYS.hosting, JSON.stringify(INITIAL_HOSTING));
      return { players: INITIAL_PLAYERS, games: INITIAL_GAMES, hosting: INITIAL_HOSTING };
    }
    return {
      players: JSON.parse(localStorage.getItem(KEYS.players)) || [],
      games:   JSON.parse(localStorage.getItem(KEYS.games))   || [],
      hosting: JSON.parse(localStorage.getItem(KEYS.hosting)) || [],
    };
  } catch {
    return { players: INITIAL_PLAYERS, games: INITIAL_GAMES, hosting: INITIAL_HOSTING };
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
    localStorage.setItem(KEYS.players, JSON.stringify(next.players));
    localStorage.setItem(KEYS.games,   JSON.stringify(next.games));
    localStorage.setItem(KEYS.hosting, JSON.stringify(next.hosting));
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

  // ── Computed ──────────────────────────────────────────────────────────────
  const hostingWithStatus = useMemo(
    () => computeHostingStatus(store.hosting),
    [store.hosting]
  );

  return {
    players: store.players,
    games:   store.games,
    hosting: hostingWithStatus,
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
  };
}
