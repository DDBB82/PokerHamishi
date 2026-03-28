import { useState, useMemo } from "react";
import { useStore } from "../context/GameStoreContext";
import {
  computePlayerStats,
  computeCumulativeScores,
  formatDateLong,
} from "../utils/statsCalculations";
import CumulativeLineChart from "../components/charts/CumulativeLineChart";

export default function Statistics() {
  const { players, games } = useStore();
  const [selectedPlayer, setSelectedPlayer] = useState("");

  const stats = useMemo(() => computePlayerStats(players, games), [players, games]);
  const cumulative = useMemo(() => computeCumulativeScores(players, games), [players, games]);

  // Sort by games played for the "Games Played Ranking" table
  const byGames = [...stats].sort((a, b) => b.gamesPlayed - a.gamesPlayed);

  // Global best/worst game
  let globalBest = null, globalWorst = null;
  for (const game of games) {
    for (const s of game.scores) {
      if (globalBest === null || s.score > globalBest.score)
        globalBest = { ...s, date: game.date };
      if (globalWorst === null || s.score < globalWorst.score)
        globalWorst = { ...s, date: game.date };
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Statistics</h1>
      </div>

      {/* Cumulative score chart */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-semibold text-slate-700">Cumulative Score Over Time</h2>
          <select
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={selectedPlayer}
            onChange={(e) => setSelectedPlayer(e.target.value)}
          >
            <option value="">All Players</option>
            {players.map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
        <CumulativeLineChart
          data={cumulative}
          players={players}
          selectedPlayer={selectedPlayer || null}
        />
      </div>

      {/* Games Played Ranking */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-700">Games Played Ranking</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Rank</th>
              <th className="px-4 py-3 text-left">Player</th>
              <th className="px-4 py-3 text-right">Games Played</th>
            </tr>
          </thead>
          <tbody>
            {byGames.map((s, i) => (
              <tr key={s.playerId} className="border-b border-slate-100 odd:bg-white even:bg-slate-50/40">
                <td className="px-4 py-2.5 text-slate-500">
                  {i === 0 ? "🥇 1" : i === 1 ? "🥈 2" : i === 2 ? "🥉 3" : i + 1}
                </td>
                <td className="px-4 py-2.5 font-medium text-slate-700">{s.name}</td>
                <td className="px-4 py-2.5 text-right text-slate-600">{s.gamesPlayed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Overall Best & Worst */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-700 mb-4">Overall Best & Worst Performances</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-700 mb-1">Best Game Ever</h3>
            {globalBest && (
              <>
                <p className="text-3xl font-bold text-green-600">+{globalBest.score}</p>
                <p className="text-sm text-green-600">{globalBest.playerName}</p>
                <p className="text-xs text-green-400">{formatDateLong(globalBest.date)}</p>
              </>
            )}
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-red-700 mb-1">Worst Game Ever</h3>
            {globalWorst && (
              <>
                <p className="text-3xl font-bold text-red-500">{globalWorst.score}</p>
                <p className="text-sm text-red-500">{globalWorst.playerName}</p>
                <p className="text-xs text-red-400">{formatDateLong(globalWorst.date)}</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Individual Player Records */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-700 mb-4">Individual Player Records</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((s) => (
            <div key={s.playerId} className="border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-700 mb-3">{s.name}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Best Game</span>
                  <span className="text-green-600 font-medium">
                    {s.bestWin !== null ? `+${s.bestWin}` : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Worst Game</span>
                  <span className="text-red-500 font-medium">
                    {s.worstLoss !== null ? s.worstLoss : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Games Played</span>
                  <span className="text-slate-700 font-medium">{s.gamesPlayed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Avg Score</span>
                  <span className={`font-medium ${s.avgScore >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {s.avgScore > 0 ? "+" : ""}{s.avgScore}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
