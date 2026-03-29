import { useState, useMemo, useEffect } from "react";
import { useStore } from "../context/GameStoreContext";
import { useAuth } from "../context/AuthContext";
import {
  computePlayerStats,
  computeCumulativeScores,
  formatDateShort,
  getInitials,
  playerColor,
} from "../utils/statsCalculations";
import PlayerBarChart from "../components/charts/PlayerBarChart";
import CumulativeLineChart from "../components/charts/CumulativeLineChart";

function Avatar({ player, size = "sm" }) {
  const sz = size === "sm" ? "w-8 h-8 text-xs" : "w-12 h-12 text-sm";
  if (player.photoBase64) {
    return <img src={player.photoBase64} alt={player.name} className={`${sz} rounded-full object-cover`} />;
  }
  return (
    <div className={`${sz} rounded-full flex items-center justify-center text-white font-bold`}
      style={{ backgroundColor: playerColor(player.name) }}>
      {getInitials(player.name)}
    </div>
  );
}

function ScoreCell({ value }) {
  if (value === null || value === undefined) return <span className="text-slate-400">—</span>;
  const cls = value >= 0 ? "text-green-600" : "text-red-500";
  return <span className={cls}>{value > 0 ? `+${value}` : value}</span>;
}

function pad(n) { return String(n).padStart(2, "0"); }

function getNextThursday21() {
  // 21:00 GMT+3 = 18:00 UTC
  const now = new Date();
  const day = now.getUTCDay();
  let daysUntil = (4 - day + 7) % 7;
  const target = new Date(now);
  target.setUTCDate(now.getUTCDate() + daysUntil);
  target.setUTCHours(18, 0, 0, 0);
  if (daysUntil === 0 && now >= target) target.setUTCDate(target.getUTCDate() + 7);
  return target;
}

export default function Dashboard() {
  const { players, games, hosting, rsvps, setRsvp, removeRsvp, settings, sessions, checkInToSession, requestRebuy, approveRebuy, denyRebuy } = useStore();
  const { currentUser } = useAuth();

  // Live game session
  const activeSession = sessions.find((s) => s.status === "active") || null;
  const liveHosting = activeSession ? hosting.find((h) => h.id === activeSession.hostingId) : null;
  const myLiveEntry = activeSession && currentUser
    ? activeSession.players.find((p) => p.playerId === currentUser.id)
    : null;
  const myPendingRebuy = activeSession && currentUser
    ? activeSession.rebuyRequests.find((r) => r.playerId === currentUser.id && r.status === "pending")
    : null;

  const [rebuyQty, setRebuyQty] = useState(1);

  const stats = useMemo(() => computePlayerStats(players, games), [players, games]);
  const cumulative = useMemo(() => computeCumulativeScores(players, games), [players, games]);

  const myPlayer = currentUser ? players.find((p) => p.name === currentUser.name) : null;
  const myPlayerId = myPlayer?.id ?? null;
  const myStats = myPlayerId ? stats.find((s) => s.playerId === myPlayerId) : null;
  const myRank = myStats ? stats.indexOf(myStats) + 1 : null;

  const myLastGame = useMemo(() => {
    if (!myPlayerId) return null;
    const sorted = [...games].sort((a, b) => new Date(b.date) - new Date(a.date));
    for (const g of sorted) {
      const sc = g.scores.find((s) => s.playerId === myPlayerId);
      if (sc) return sc.score;
    }
    return null;
  }, [myPlayerId, games]);

  // Days until logged-in player hosts
  const daysUntilHost = useMemo(() => {
    if (!currentUser) return null;
    const now = new Date();
    const future = hosting
      .filter((h) => h.playerName === currentUser.name && new Date(h.date) > now)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    if (future.length === 0) return null;
    return Math.ceil((new Date(future[0].date) - now) / 86400000);
  }, [currentUser, hosting]);

  // Countdown timer to next Thursday 21:00 GMT+3
  const [timeLeft, setTimeLeft] = useState(null);
  useEffect(() => {
    function update() {
      const diff = getNextThursday21() - new Date();
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      });
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const [selectedId, setSelectedId] = useState(myPlayerId);
  const selectedStats = selectedId ? stats.find((s) => s.playerId === selectedId) : null;

  const recentGames = useMemo(() => {
    if (!selectedId) return [];
    const sorted = [...games].sort((a, b) => new Date(b.date) - new Date(a.date));
    const found = [];
    for (const g of sorted) {
      const sc = g.scores.find((s) => s.playerId === selectedId);
      if (sc) found.push({ date: g.date, score: sc.score });
      if (found.length === 5) break;
    }
    return found;
  }, [selectedId, games]);

  const barData = stats.map((s) => ({ playerId: s.playerId, name: s.name, totalScore: s.totalScore }));

  return (
    <div className="space-y-6">
      {/* ── LIVE GAME BANNER (takes over when a session is active) ── */}
      {activeSession && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">🃏 Game is Live!</p>
              <h2 className="text-2xl font-bold text-slate-800">
                {liveHosting
                  ? new Date(liveHosting.date).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
                  : "Tonight's Game"}
              </h2>
              {liveHosting && <p className="text-slate-500 text-sm">Hosted by {liveHosting.playerName}</p>}
            </div>
            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full animate-pulse">
              LIVE
            </span>
          </div>

          {/* My status */}
          {!currentUser ? (
            <p className="text-slate-400 text-sm">Sign in to join the game</p>
          ) : !myLiveEntry ? (
            <button
              onClick={() => checkInToSession(activeSession.id, currentUser.id, currentUser.name)}
              className="w-full py-3 rounded-xl text-base font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              🃏 I'm In! (+1 V · 50 NIS · 100 chips)
            </button>
          ) : (
            <div className="space-y-3">
              {/* V count */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1">Your Buy-ins</p>
                <p className="text-5xl font-bold text-slate-800">{myLiveEntry.buys} <span className="text-3xl font-semibold text-green-500">V</span></p>
                <p className="text-slate-400 text-sm mt-1">{myLiveEntry.buys * 50} NIS · {myLiveEntry.buys * 100} chips</p>
              </div>
              {/* Rebuy request */}
              {myPendingRebuy ? (
                <p className="text-center text-slate-500 text-sm font-medium">⏳ Rebuy request ({myPendingRebuy.quantity} V) pending admin approval</p>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
                    <span className="text-slate-500 text-sm flex-1">How many V's?</span>
                    <button onClick={() => setRebuyQty(q => Math.max(1, q - 1))} className="text-slate-600 font-bold text-lg px-2 hover:text-slate-800">−</button>
                    <span className="text-slate-800 font-bold text-xl w-8 text-center">{rebuyQty}</span>
                    <button onClick={() => setRebuyQty(q => Math.min(10, q + 1))} className="text-slate-600 font-bold text-lg px-2 hover:text-slate-800">+</button>
                  </div>
                  <button
                    onClick={() => { requestRebuy(activeSession.id, currentUser.id, currentUser.name, rebuyQty); setRebuyQty(1); }}
                    className="w-full py-4 rounded-xl text-lg font-bold bg-green-500 hover:bg-green-600 text-white transition-colors shadow-sm"
                  >
                    Request Rebuy +{rebuyQty} V · {rebuyQty * 50} NIS
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Players in game */}
          {activeSession.players.length > 0 && (
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-2">Players In ({activeSession.players.length})</p>
              <div className="flex flex-wrap gap-2">
                {activeSession.players.map((p) => {
                  const isMe = p.playerId === currentUser?.id;
                  return (
                    <div key={p.playerId} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium ${isMe ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-slate-100 text-slate-600"}`}>
                      <span>{p.playerName}{isMe ? " (You)" : ""}</span>
                      <span className="text-green-600 text-xs font-bold">{p.buys}V</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Admin: pending rebuy approvals */}
          {currentUser?.isAdmin && (() => {
            const pending = activeSession.rebuyRequests.filter(r => r.status === "pending");
            if (pending.length === 0) return null;
            return (
              <div className="border-t border-slate-200 pt-4 space-y-2">
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">⏳ Pending Rebuys ({pending.length})</p>
                {pending.map(r => (
                  <div key={r.id} className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                    <span className="flex-1 text-slate-700 font-medium text-sm">{r.playerName}</span>
                    <span className="text-green-600 text-sm font-bold">+{r.quantity || 1} V</span>
                    <button
                      onClick={() => approveRebuy(activeSession.id, r.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-700 hover:bg-slate-800 text-white transition-colors"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => denyRebuy(activeSession.id, r.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                    >
                      ✗ Deny
                    </button>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Header — hidden when live game is active */}
      {!activeSession && (
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Your Poker Stats</h1>
        <p className="text-slate-500 text-sm">View your poker journey</p>
      </div>
      )}

      {/* Info cards: countdown + host — hidden during live game */}
      {!activeSession && <div className={`grid gap-4 ${currentUser && daysUntilHost !== null ? "grid-cols-2" : "grid-cols-1"}`}>
        {/* Countdown */}
        {timeLeft && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-center">
            <p className="text-sm font-semibold text-slate-600 mb-3">Next Thursday Poker</p>
            <div className="flex items-center justify-center gap-3">
              {[{ v: timeLeft.days, l: "d" }, { v: timeLeft.hours, l: "h" }, { v: timeLeft.mins, l: "m" }].map(({ v, l }) => (
                <div key={l} className="flex flex-col items-center">
                  <span className="text-4xl font-bold text-indigo-600 tabular-nums">{pad(v)}</span>
                  <span className="text-sm text-slate-400">{l}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Days until you host */}
        {currentUser && daysUntilHost !== null && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-center">
            <p className="text-sm font-semibold text-slate-600 mb-1">You host in</p>
            <p className="text-4xl font-bold text-amber-500">{daysUntilHost}</p>
            <p className="text-sm text-slate-400">days</p>
          </div>
        )}
      </div>}

      {/* Next Game Registration card */}
      {(() => {
        const nextGame = hosting.find((h) => h.status === "next");
        if (!nextGame || !nextGame.rsvpOpen) return null;
        const maxPlayers = settings?.maxPlayers ?? 9;
        const gameRsvps = rsvps.filter((r) => r.hostingId === nextGame.id);
        const inList = gameRsvps.filter((r) => r.status === "in");
        const standbyList = gameRsvps
          .filter((r) => r.status === "standby")
          .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        const spotsLeft = maxPlayers - inList.length;
        const isFull = inList.length >= maxPlayers;
        const myRsvp = currentUser
          ? gameRsvps.find((r) => r.playerId === currentUser.id)
          : null;
        const alertLabel = isFull
          ? "🚨🚨 FULL"
          : inList.length >= 8
          ? "🚨🚨"
          : inList.length >= 7
          ? "🚨"
          : "";

        function handleRsvp(status) {
          if (!currentUser) return;
          if (myRsvp?.status === status) {
            removeRsvp(nextGame.id, currentUser.id);
          } else {
            setRsvp(nextGame.id, currentUser.id, currentUser.name, status);
          }
        }

        const myStandbyPos = myRsvp?.status === "standby"
          ? standbyList.findIndex((r) => r.playerId === currentUser?.id) + 1
          : null;

        return (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
            {/* Card header */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-semibold text-slate-700 text-base">Next Game Registration</h2>
              <div className="flex items-center gap-2">
                {alertLabel && (
                  <span className="text-sm font-bold text-red-600">{alertLabel}</span>
                )}
                <span className="text-xs text-slate-400">
                  {new Date(nextGame.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${isFull ? "bg-red-500" : inList.length >= 7 ? "bg-amber-500" : "bg-indigo-500"}`}
                  style={{ width: `${Math.min((inList.length / maxPlayers) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>{inList.length}/{maxPlayers} registered</span>
                <span>{isFull ? "Full!" : `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left`}</span>
              </div>
            </div>

            {/* Action buttons */}
            {!currentUser ? (
              <p className="text-xs text-slate-400 italic">Sign in to register</p>
            ) : myRsvp?.status === "in" && isFull ? (
              <p className="text-sm font-semibold text-green-600">✅ Your spot is confirmed!</p>
            ) : isFull ? (
              myRsvp?.status === "standby" ? (
                <div className="space-y-2">
                  <p className="text-sm text-amber-600 font-medium">
                    ⏳ You're on standby{myStandbyPos ? ` (#${myStandbyPos})` : ""} — you'll be notified if a spot opens
                  </p>
                  <button
                    onClick={() => removeRsvp(nextGame.id, currentUser.id)}
                    className="w-full py-2.5 rounded-lg font-semibold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    Leave Standby
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-base font-bold text-red-500">🚫 Sorry, we are full</p>
                  <button
                    onClick={() => handleRsvp("standby")}
                    className="w-full py-2.5 rounded-lg font-semibold text-sm bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  >
                    📋 Join Standby
                  </button>
                </div>
              )
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => handleRsvp("in")}
                  className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                    myRsvp?.status === "in"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                  }`}
                >
                  ✅ I'm In
                </button>
                <button
                  onClick={() => handleRsvp("out")}
                  className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                    myRsvp?.status === "out"
                      ? "bg-red-500 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600"
                  }`}
                >
                  ❌ I'm Out
                </button>
              </div>
            )}

            {/* Player lists */}
            <div className="space-y-2 pt-1">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  ✅ In ({inList.length})
                </p>
                {inList.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {inList.map((r) => {
                      const isMe = currentUser?.id === r.playerId;
                      return (
                        <span
                          key={r.id}
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            isMe
                              ? "bg-amber-200 text-amber-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {r.playerName}{isMe ? " (You)" : ""}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No one yet</p>
                )}
              </div>

              {standbyList.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    ⏳ Standby ({standbyList.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {standbyList.map((r, idx) => {
                      const isMe = currentUser?.id === r.playerId;
                      return (
                        <span
                          key={r.id}
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            isMe
                              ? "bg-amber-200 text-amber-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {r.playerName}{isMe ? ` (You - #${idx + 1} on standby)` : ""}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Your Stats hero card */}
      {currentUser && myStats && myPlayer && (
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-xl p-5 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Avatar player={myPlayer} size="lg" />
            <div>
              <p className="text-indigo-200 text-xs font-medium uppercase tracking-wide">Your Stats</p>
              <h2 className="text-xl font-bold leading-tight">{currentUser.name}</h2>
              <p className="text-indigo-200 text-sm">Rank #{myRank} · {myStats.gamesPlayed} games</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total", value: myStats.totalScore },
              { label: "Avg / Game", value: myStats.avgScore },
              { label: "Last Game", value: myLastGame },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-indigo-200 text-xs mb-1">{label}</p>
                <p className="font-bold text-lg">
                  {value === null ? "—" : value > 0 ? `+${value}` : value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rankings Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-700">Player Rankings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Rank</th>
                <th className="px-4 py-3 text-left">Player</th>
                <th className="px-4 py-3 text-right">Games</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Avg</th>
                <th className="px-4 py-3 text-right">Best Win</th>
                <th className="px-4 py-3 text-right">Worst Loss</th>
                <th className="px-4 py-3 text-right">Diff ▲</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s, idx) => {
                const above = idx > 0 ? stats[idx - 1] : null;
                const diff = above ? s.totalScore - above.totalScore : null;
                const isSelected = selectedId === s.playerId;
                const isMe = myPlayerId === s.playerId;
                const player = players.find((p) => p.id === s.playerId) || { name: s.name, photoBase64: null };
                return (
                  <tr
                    key={s.playerId}
                    onClick={() => setSelectedId(isSelected ? null : s.playerId)}
                    className={`border-b border-slate-100 cursor-pointer transition-colors ${
                      isSelected ? "bg-indigo-50" :
                      isMe ? "bg-amber-50 hover:bg-amber-100" :
                      "hover:bg-slate-50 odd:bg-white even:bg-slate-50/40"
                    }`}
                  >
                    <td className="px-4 py-3 text-slate-500 font-medium">
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar player={player} size="sm" />
                        <span className="font-medium text-slate-800">{s.name}</span>
                        {isMe && <span className="text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-medium">You</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{s.gamesPlayed}</td>
                    <td className="px-4 py-3 text-right font-semibold"><ScoreCell value={s.totalScore} /></td>
                    <td className="px-4 py-3 text-right"><ScoreCell value={s.avgScore} /></td>
                    <td className="px-4 py-3 text-right text-green-600">{s.bestWin !== null ? `+${s.bestWin}` : "—"}</td>
                    <td className="px-4 py-3 text-right text-red-500">{s.worstLoss !== null ? s.worstLoss : "—"}</td>
                    <td className="px-4 py-3 text-right text-red-400 text-xs">{diff !== null ? diff : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Player Detail Panel */}
      {selectedStats && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Avatar
              player={players.find((p) => p.id === selectedId) || { name: selectedStats.name, photoBase64: null }}
              size="lg"
            />
            <div>
              <h2 className="text-lg font-bold text-indigo-800">{selectedStats.name}</h2>
              <p className="text-sm text-indigo-500">
                {selectedStats.gamesPlayed} games · Avg {selectedStats.avgScore > 0 ? "+" : ""}{selectedStats.avgScore}
              </p>
            </div>
            <button className="ml-auto text-indigo-400 hover:text-indigo-700" onClick={() => setSelectedId(null)}>✕</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {[
              { label: "Total Score", value: selectedStats.totalScore, colored: true },
              { label: "Best Win", value: selectedStats.bestWin, colored: true },
              { label: "Worst Loss", value: selectedStats.worstLoss, colored: true },
              { label: "Win Streak", value: selectedStats.bestWinStreak, suffix: " games" },
            ].map(({ label, value, colored, suffix }) => (
              <div key={label} className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className={`font-bold text-lg ${colored ? (value >= 0 ? "text-green-600" : "text-red-500") : "text-slate-700"}`}>
                  {colored && value > 0 ? `+${value}` : value}{suffix || ""}
                </p>
              </div>
            ))}
          </div>
          {recentGames.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-indigo-700 mb-2 uppercase tracking-wide">Last {recentGames.length} Games</p>
              <div className="flex gap-2 flex-wrap">
                {recentGames.map((g, i) => (
                  <div key={i} className="bg-white rounded-lg px-3 py-2 shadow-sm text-sm">
                    <span className="text-slate-400 text-xs block">{formatDateShort(g.date)}</span>
                    <span className={`font-semibold ${g.score >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {g.score > 0 ? `+${g.score}` : g.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="h-48">
            <CumulativeLineChart data={cumulative} players={players} selectedPlayer={selectedStats.name} loggedInPlayer={currentUser?.name || null} />
          </div>
        </div>
      )}

      {/* Bar Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-700 mb-4">Player Performance Chart</h2>
        <PlayerBarChart data={barData} highlightId={selectedId} />
      </div>
    </div>
  );
}
