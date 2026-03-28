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
  const { players, games, hosting } = useStore();
  const { currentUser } = useAuth();

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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Your Poker Stats</h1>
        <p className="text-slate-500 text-sm">View your poker journey</p>
      </div>

      {/* Info cards: countdown + host */}
      <div className={`grid gap-4 ${currentUser && daysUntilHost !== null ? "grid-cols-2" : "grid-cols-1"}`}>
        {/* Countdown */}
        {timeLeft && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-2">Next Thursday 21:00</p>
            <div className="flex items-center justify-center gap-2">
              {[{ v: timeLeft.days, l: "d" }, { v: timeLeft.hours, l: "h" }, { v: timeLeft.mins, l: "m" }, { v: timeLeft.secs, l: "s" }].map(({ v, l }) => (
                <div key={l} className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-indigo-600 tabular-nums">{pad(v)}</span>
                  <span className="text-xs text-slate-400">{l}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Days until you host */}
        {currentUser && daysUntilHost !== null && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-2">You host in</p>
            <p className="text-2xl font-bold text-amber-500">{daysUntilHost}</p>
            <p className="text-xs text-slate-400">days</p>
          </div>
        )}
      </div>

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
            <CumulativeLineChart data={cumulative} players={players} selectedPlayer={selectedStats.name} />
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
