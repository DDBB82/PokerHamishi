import { useState, useRef } from "react";
import { useStore } from "../context/GameStoreContext";
import { useAuth } from "../context/AuthContext";
import { formatDateLong, getInitials, playerColor } from "../utils/statsCalculations";

// ── Shared helpers ────────────────────────────────────────────────────────────
function Btn({ onClick, children, variant = "primary", type = "button", className = "" }) {
  const base = "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors";
  const styles = {
    primary:   "bg-indigo-600 hover:bg-indigo-700 text-white",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-700",
    danger:    "bg-red-100 hover:bg-red-200 text-red-700",
  };
  return (
    <button type={type} onClick={onClick} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}

// ── Admin login gate ──────────────────────────────────────────────────────────
function AdminLoginGate() {
  const { openLogin } = useAuth();
  return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 w-full max-w-sm text-center">
        <h1 className="text-xl font-bold text-slate-800 mb-2">Admin Access</h1>
        <p className="text-slate-500 text-sm mb-6">
          Sign in with your admin account to manage game data.
        </p>
        <button
          onClick={openLogin}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          Sign In
        </button>
      </div>
    </div>
  );
}

// ── Tab: Manage Games ─────────────────────────────────────────────────────────
function ManageGames({ players, games, addGame, updateGame, deleteGame }) {
  const [mode, setMode] = useState("add");
  const [editId, setEditId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [host, setHost] = useState("");
  const [scores, setScores] = useState([]);
  const [pickPlayer, setPickPlayer] = useState("");
  const [pickScore, setPickScore] = useState("");
  const [msg, setMsg] = useState("");

  function loadGame(id) {
    const g = games.find((g) => g.id === id);
    if (!g) return;
    setDate(new Date(g.date).toISOString().slice(0, 10));
    setHost(g.hostName || "");
    setScores(g.scores.map((s) => ({ ...s })));
    setMsg("");
  }

  function addScore() {
    if (!pickPlayer || pickScore === "") return;
    const p = players.find((p) => p.id === pickPlayer);
    if (!p) return;
    if (scores.some((s) => s.playerId === pickPlayer)) {
      setScores(scores.map((s) =>
        s.playerId === pickPlayer ? { ...s, score: Number(pickScore) } : s
      ));
    } else {
      setScores([...scores, { playerId: pickPlayer, playerName: p.name, score: Number(pickScore) }]);
    }
    setPickScore("");
  }

  function save() {
    if (!date || scores.length === 0) { setMsg("Add at least one score."); return; }
    const gameData = { date: `${date}T12:00:00.000Z`, hostName: host, scores };
    if (mode === "add") {
      addGame(gameData);
      setScores([]); setHost(""); setMsg("Game added!");
    } else {
      updateGame(editId, gameData);
      setMsg("Game updated!");
    }
  }

  const sortedGames = [...games].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <Btn variant={mode === "add" ? "primary" : "secondary"} onClick={() => { setMode("add"); setScores([]); setHost(""); setMsg(""); }}>+ Add Game</Btn>
        <Btn variant={mode === "edit" ? "primary" : "secondary"} onClick={() => { setMode("edit"); setMsg(""); }}>Edit / Delete</Btn>
      </div>

      {mode === "edit" && (
        <div>
          <label className="block text-sm text-slate-600 mb-1 font-medium">Select game to edit</label>
          <select
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={editId}
            onChange={(e) => { setEditId(e.target.value); loadGame(e.target.value); }}
          >
            <option value="">— select —</option>
            {sortedGames.map((g) => (
              <option key={g.id} value={g.id}>{formatDateLong(g.date)} ({g.scores.length} players)</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Host</label>
          <select value={host} onChange={(e) => setHost(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">— none —</option>
            {players.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg p-4 space-y-3">
        <p className="text-sm font-medium text-slate-600">Scores</p>
        <div className="flex gap-2 flex-wrap">
          <select value={pickPlayer} onChange={(e) => setPickPlayer(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">Player…</option>
            {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input type="number" value={pickScore} onChange={(e) => setPickScore(e.target.value)}
            placeholder="Score"
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <Btn onClick={addScore}>Add</Btn>
        </div>
        {scores.length > 0 && (
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
            {[...scores].sort((a, b) => b.score - a.score).map((s) => (
              <div key={s.playerId} className="flex items-center justify-between px-3 py-2 text-sm bg-white">
                <span className="text-slate-700">{s.playerName}</span>
                <div className="flex items-center gap-3">
                  <span className={s.score >= 0 ? "text-green-600" : "text-red-500"}>
                    {s.score > 0 ? `+${s.score}` : s.score}
                  </span>
                  <button className="text-slate-400 hover:text-red-500 text-xs"
                    onClick={() => setScores(scores.filter((x) => x.playerId !== s.playerId))}>✕</button>
                </div>
              </div>
            ))}
            <div className="px-3 py-1.5 bg-slate-50 text-xs text-slate-500 flex justify-between">
              <span>Sum</span>
              <span className={scores.reduce((a, s) => a + s.score, 0) === 0 ? "text-green-600" : "text-orange-500"}>
                {scores.reduce((a, s) => a + s.score, 0)}
                {scores.reduce((a, s) => a + s.score, 0) !== 0 && " ⚠ not zero-sum"}
              </span>
            </div>
          </div>
        )}
      </div>

      {msg && <p className="text-sm text-green-600">{msg}</p>}
      <div className="flex gap-2">
        <Btn onClick={save}>{mode === "add" ? "Save Game" : "Update Game"}</Btn>
        {mode === "edit" && editId && (
          <Btn variant="danger" onClick={() => {
            if (confirm("Delete this game?")) { deleteGame(editId); setEditId(""); setScores([]); setMsg("Game deleted."); }
          }}>
            Delete
          </Btn>
        )}
      </div>
    </div>
  );
}

// ── Tab: Players ──────────────────────────────────────────────────────────────
function ManagePlayers({ players, addPlayer, removePlayer, updatePlayerPhoto, updatePlayerName, addCredential, removeCredential }) {
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const fileRef = useRef();
  const [photoTarget, setPhotoTarget] = useState(null);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file || !photoTarget) return;
    const reader = new FileReader();
    reader.onload = () => { updatePlayerPhoto(photoTarget, reader.result); setPhotoTarget(null); };
    reader.readAsDataURL(file);
  }

  function handleAdd() {
    if (!name.trim()) return;
    const player = addPlayer(name);
    addCredential(player.id, player.name);
    setName("");
  }

  function handleRemove(p) {
    if (!confirm(`Remove ${p.name}?`)) return;
    removePlayer(p.id);
    removeCredential(p.id);
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)}
          placeholder="New player name"
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
        <Btn onClick={handleAdd}>Add Player</Btn>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      <div className="space-y-2">
        {players.map((p) => (
          <div key={p.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-4 py-3">
            {p.photoBase64 ? (
              <img src={p.photoBase64} alt={p.name} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: playerColor(p.name) }}>
                {getInitials(p.name)}
              </div>
            )}

            {editingId === p.id ? (
              <>
                <input value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="border border-slate-200 rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                <Btn onClick={() => { updatePlayerName(p.id, editName); setEditingId(null); }}>Save</Btn>
                <Btn variant="secondary" onClick={() => setEditingId(null)}>Cancel</Btn>
              </>
            ) : (
              <>
                <span className="flex-1 font-medium text-slate-700">{p.name}</span>
                <Btn variant="secondary" onClick={() => { setEditingId(p.id); setEditName(p.name); }}>Rename</Btn>
                <Btn variant="secondary" onClick={() => { setPhotoTarget(p.id); fileRef.current.click(); }}>Photo</Btn>
                <Btn variant="danger" onClick={() => handleRemove(p)}>Remove</Btn>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Hosting ──────────────────────────────────────────────────────────────
function ManageHosting({
  players, hosting, addHostEntry, updateHostEntry, deleteHostEntry,
  sessions, toggleRsvpOpen, createSession, startSession, endSession,
  approveRebuy, denyRebuy,
}) {
  const [date, setDate] = useState("");
  const [pname, setPname] = useState("");
  const [editId, setEditId] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editPname, setEditPname] = useState("");

  const sorted = [...hosting].sort((a, b) => new Date(b.date) - new Date(a.date));
  const next = hosting.find((h) => h.status === "next");
  const nextSession = next ? sessions.find((s) => s.hostingId === next.id) : null;

  return (
    <div className="space-y-5">
      <div className="flex gap-2 flex-wrap">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        <select value={pname} onChange={(e) => setPname(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option value="">Select player…</option>
          {players.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
        </select>
        <Btn onClick={() => {
          if (date && pname) { addHostEntry({ date: `${date}T12:00:00.000Z`, playerName: pname }); setDate(""); setPname(""); }
        }}>
          Add
        </Btn>
      </div>

      <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
        {sorted.map((h) => {
          const isFutureEntry = h.status === "next" || h.status === "upcoming";
          const isNext = h.status === "next";
          const entrySession = isNext ? nextSession : null;
          return (
            <div key={h.id} className="px-4 py-3 bg-white text-sm space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                {editId === h.id ? (
                  <>
                    <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)}
                      className="border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                    <select value={editPname} onChange={(e) => setEditPname(e.target.value)}
                      className="border border-slate-200 rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-400">
                      {players.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                    <Btn onClick={() => { updateHostEntry(h.id, { date: `${editDate}T12:00:00.000Z`, playerName: editPname }); setEditId(null); }}>Save</Btn>
                    <Btn variant="secondary" onClick={() => setEditId(null)}>Cancel</Btn>
                  </>
                ) : (
                  <>
                    <span className="text-slate-500 w-32">{formatDateLong(h.date)}</span>
                    <span className="flex-1 font-medium text-slate-700">{h.playerName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      h.status === "next"     ? "bg-indigo-100 text-indigo-700" :
                      h.status === "upcoming" ? "bg-slate-100 text-slate-600" :
                                                "bg-gray-100 text-gray-400"
                    }`}>{h.status}</span>

                    {/* RSVP toggle — future entries only */}
                    {isFutureEntry && (
                      <button
                        onClick={() => toggleRsvpOpen(h.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          h.rsvpOpen
                            ? "bg-green-100 hover:bg-green-200 text-green-700"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                        }`}
                      >
                        {h.rsvpOpen ? "Close RSVP" : "Open RSVP"}
                      </button>
                    )}

                    {/* Session controls — next entry only */}
                    {isNext && !entrySession && (
                      <Btn onClick={() => createSession(h.id)}>Create Session</Btn>
                    )}
                    {isNext && entrySession?.status === "waiting" && (
                      <Btn onClick={() => startSession(entrySession.id)}>Start Game</Btn>
                    )}
                    {isNext && entrySession?.status === "active" && (
                      <Btn variant="danger" onClick={() => {
                        if (confirm("End the game session?")) endSession(entrySession.id);
                      }}>End Game</Btn>
                    )}

                    <Btn variant="secondary" onClick={() => { setEditId(h.id); setEditDate(new Date(h.date).toISOString().slice(0, 10)); setEditPname(h.playerName); }}>Edit</Btn>
                    <Btn variant="danger" onClick={() => { if (confirm("Delete this entry?")) deleteHostEntry(h.id); }}>Del</Btn>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && (
          <div className="px-4 py-8 text-center text-slate-400 text-sm">No hosting entries</div>
        )}
      </div>

      {/* AdminSession panel */}
      {nextSession && (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
            <h3 className="font-semibold text-slate-700 text-sm">
              {nextSession.status === "ended" ? "Session Summary" : "🃏 Active Session"}
            </h3>
          </div>
          <div className="p-5 space-y-4">
            {/* Player check-in list */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Players ({nextSession.players.length})
              </p>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-right">Buys (V)</th>
                      <th className="px-4 py-2 text-right">NIS</th>
                      <th className="px-4 py-2 text-right">Chips</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nextSession.players.map((p) => (
                      <tr key={p.playerId} className="border-t border-slate-100">
                        <td className="px-4 py-2 font-medium text-slate-700">{p.playerName}</td>
                        <td className="px-4 py-2 text-right font-bold text-green-600">{p.buys} V</td>
                        <td className="px-4 py-2 text-right text-slate-600">{p.buys * 50}</td>
                        <td className="px-4 py-2 text-right text-slate-600">{p.buys * 100}</td>
                      </tr>
                    ))}
                    {nextSession.players.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-4 text-center text-slate-400">No players yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pending rebuy requests */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Pending Rebuy Requests
              </p>
              {nextSession.rebuyRequests.filter((r) => r.status === "pending").length === 0 ? (
                <p className="text-xs text-slate-400 italic">No pending requests</p>
              ) : (
                <div className="space-y-2">
                  {nextSession.rebuyRequests
                    .filter((r) => r.status === "pending")
                    .map((r) => (
                      <div key={r.id} className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                        <span className="flex-1 font-medium text-slate-700 text-sm">{r.playerName}</span>
                        <span className="font-bold text-green-600 text-sm">+{r.quantity || 1} V</span>
                        <span className="text-xs text-slate-400">
                          {new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <Btn
                          onClick={() => approveRebuy(nextSession.id, r.id)}
                          className="bg-green-100 hover:bg-green-200 text-green-700"
                        >
                          ✓ Approve
                        </Btn>
                        <Btn
                          variant="danger"
                          onClick={() => denyRebuy(nextSession.id, r.id)}
                        >
                          ✗ Deny
                        </Btn>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Passwords ────────────────────────────────────────────────────────────
function ManagePasswords({ credentials, resetPin, toggleAdmin, settings, updateSettings }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Share each player's PIN privately. You can reset any PIN or grant admin access.
      </p>
      <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
        {credentials.map((c) => (
          <div key={c.id} className="flex items-center gap-3 px-4 py-3 bg-white text-sm flex-wrap">
            <span className="flex-1 font-medium text-slate-700 flex items-center gap-2">
              {c.name}
              {c.isSuperAdmin && (
                <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">Super Admin</span>
              )}
              {c.isAdmin && !c.isSuperAdmin && (
                <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">Admin</span>
              )}
            </span>
            <span className="font-mono text-slate-700 bg-slate-100 px-2.5 py-1 rounded tracking-widest">
              {c.password}
            </span>
            <Btn variant="secondary" onClick={() => resetPin(c.id)}>Reset PIN</Btn>
            {!c.isSuperAdmin && (
              <Btn
                variant={c.isAdmin ? "danger" : "secondary"}
                onClick={() => toggleAdmin(c.id)}
              >
                {c.isAdmin ? "Remove Admin" : "Make Admin"}
              </Btn>
            )}
          </div>
        ))}
        {credentials.length === 0 && (
          <div className="px-4 py-8 text-center text-slate-400 text-sm">No players found</div>
        )}
      </div>

      {/* Game Settings */}
      <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
        <h3 className="font-semibold text-slate-700 text-sm">Game Settings</h3>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm text-slate-600 font-medium">Max players per game</label>
          <input
            type="number"
            min={2}
            max={20}
            value={settings?.maxPlayers ?? 9}
            onChange={(e) => updateSettings({ maxPlayers: Number(e.target.value) })}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <span className="text-xs text-slate-400">Current: {settings?.maxPlayers ?? 9}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Admin page ───────────────────────────────────────────────────────────
const TABS = ["Manage Games", "Players", "Hosting", "Passwords"];

export default function Admin() {
  const [tab, setTab] = useState(0);
  const { currentUser, logout, credentials, resetPin, toggleAdmin } = useAuth();

  const {
    players, games, hosting,
    addPlayer, removePlayer, updatePlayerPhoto, updatePlayerName,
    addGame, updateGame, deleteGame,
    addHostEntry, updateHostEntry, deleteHostEntry,
    sessions, toggleRsvpOpen, createSession, startSession, endSession,
    approveRebuy, denyRebuy,
    settings, updateSettings,
  } = useStore();

  const { addCredential, removeCredential } = useAuth();

  if (!currentUser?.isAdmin) return <AdminLoginGate />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Admin</h1>
          <p className="text-slate-500 text-sm">Manage game data</p>
        </div>
        <Btn variant="secondary" onClick={logout}>Log out</Btn>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === i
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        {tab === 0 && <ManageGames players={players} games={games} addGame={addGame} updateGame={updateGame} deleteGame={deleteGame} />}
        {tab === 1 && (
          <ManagePlayers
            players={players}
            addPlayer={addPlayer}
            removePlayer={removePlayer}
            updatePlayerPhoto={updatePlayerPhoto}
            updatePlayerName={updatePlayerName}
            addCredential={addCredential}
            removeCredential={removeCredential}
          />
        )}
        {tab === 2 && (
          <ManageHosting
            players={players}
            hosting={hosting}
            addHostEntry={addHostEntry}
            updateHostEntry={updateHostEntry}
            deleteHostEntry={deleteHostEntry}
            sessions={sessions}
            toggleRsvpOpen={toggleRsvpOpen}
            createSession={createSession}
            startSession={startSession}
            endSession={endSession}
            approveRebuy={approveRebuy}
            denyRebuy={denyRebuy}
          />
        )}
        {tab === 3 && <ManagePasswords credentials={credentials} resetPin={resetPin} toggleAdmin={toggleAdmin} settings={settings} updateSettings={updateSettings} />}
      </div>
    </div>
  );
}
