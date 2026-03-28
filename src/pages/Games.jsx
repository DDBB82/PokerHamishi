import { useState, useMemo, useRef } from "react";
import { useStore } from "../context/GameStoreContext";
import { useAuth } from "../context/AuthContext";
import {
  getDistinctMonths,
  getGamesByMonth,
  computeMonthlyRankings,
  formatDateLong,
  formatYearMonth,
} from "../utils/statsCalculations";

function GamePhotos({ game, onAdd, onRemove }) {
  const fileRef = useRef();
  const [lightbox, setLightbox] = useState(null);
  const photos = game.photos || [];

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { onAdd(reader.result); e.target.value = ""; };
    reader.readAsDataURL(file);
  }

  return (
    <div className="px-5 py-3 border-t border-slate-100">
      <div className="flex items-center gap-2 flex-wrap">
        {photos.map((src, i) => (
          <div key={i} className="relative group w-16 h-16 flex-shrink-0">
            <img src={src} alt={`Game photo ${i + 1}`}
              className="w-16 h-16 object-cover rounded-lg cursor-pointer border border-slate-200 hover:border-indigo-400 transition-colors"
              onClick={() => setLightbox(i)} />
            <button onClick={() => onRemove(i)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center leading-none">✕</button>
          </div>
        ))}
        <button onClick={() => fileRef.current.click()}
          className="w-16 h-16 flex-shrink-0 rounded-lg border-2 border-dashed border-slate-300 hover:border-indigo-400 text-slate-400 hover:text-indigo-500 transition-colors flex flex-col items-center justify-center text-xs gap-0.5">
          <span className="text-lg leading-none">+</span>
          <span>Photo</span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      {lightbox !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={photos[lightbox]} alt="" className="w-full max-h-[80vh] object-contain rounded-lg" />
            <div className="absolute top-2 right-2 flex gap-2">
              {lightbox > 0 && (
                <button onClick={() => setLightbox(lightbox - 1)} className="bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70">‹</button>
              )}
              {lightbox < photos.length - 1 && (
                <button onClick={() => setLightbox(lightbox + 1)} className="bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70">›</button>
              )}
              <button onClick={() => setLightbox(null)} className="bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/70">✕</button>
            </div>
            <p className="text-center text-white/60 text-xs mt-2">{lightbox + 1} / {photos.length}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreCell({ value }) {
  if (value === null || value === undefined) return <span className="text-slate-400">—</span>;
  const cls = value >= 0 ? "text-green-600" : "text-red-500";
  return <span className={cls}>{value > 0 ? `+${value}` : value}</span>;
}

export default function Games() {
  const { players, games, addGamePhoto, removeGamePhoto } = useStore();
  const { currentUser } = useAuth();
  const months = useMemo(() => getDistinctMonths(games), [games]);
  const [selected, setSelected] = useState(months[0] || "");

  const [year, month] = selected ? selected.split("-").map(Number) : [null, null];
  const monthGames = useMemo(
    () => (year && month ? getGamesByMonth(games, year, month) : []),
    [games, year, month]
  );
  const rankings = useMemo(
    () => (year && month ? computeMonthlyRankings(players, games, year, month) : []),
    [players, games, year, month]
  );

  const sortedGames = [...monthGames].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Games</h1>
          <p className="text-slate-500 text-sm">View game results</p>
        </div>
        <select
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          value={selected} onChange={(e) => setSelected(e.target.value)}
        >
          {months.map((m) => <option key={m} value={m}>{formatYearMonth(m)}</option>)}
        </select>
      </div>

      {selected && (
        <>
          {/* Monthly Rankings */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-700">{formatYearMonth(selected)} Rankings</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">Rank</th>
                    <th className="px-4 py-3 text-left">Player</th>
                    <th className="px-4 py-3 text-right">Games</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">No games this month</td></tr>
                  )}
                  {rankings.map((r, i) => {
                    const isMe = currentUser?.name === r.name;
                    return (
                      <tr key={r.name} className={`border-b border-slate-100 ${
                        isMe ? "bg-amber-50" : "odd:bg-white even:bg-slate-50/40"
                      }`}>
                        <td className="px-4 py-2.5 text-slate-500">
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-slate-700">
                          <span>{r.name}</span>
                          {isMe && <span className="ml-2 text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-medium">You</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-500">{r.gamesPlayed}</td>
                        <td className="px-4 py-2.5 text-right font-semibold"><ScoreCell value={r.total} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Game cards */}
          <h2 className="font-semibold text-slate-700">{formatYearMonth(selected)} Games</h2>
          <div className="space-y-4">
            {sortedGames.length === 0 && (
              <div className="bg-white rounded-xl p-8 text-center text-slate-400 border border-slate-200">No games recorded for this month.</div>
            )}
            {sortedGames.map((game) => {
              const sorted = [...game.scores].sort((a, b) => b.score - a.score);
              const iHosted = currentUser?.name === game.hostName;
              return (
                <div key={game.id} className={`rounded-xl shadow-sm border overflow-hidden ${
                  iHosted ? "border-amber-300" : "border-slate-200 bg-white"
                }`}>
                  <div className={`px-5 py-3 border-b flex items-center justify-between ${
                    iHosted ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-100"
                  }`}>
                    <span className="font-semibold text-slate-700">{formatDateLong(game.date)}</span>
                    {game.hostName && (
                      <span className={`text-xs ${iHosted ? "text-amber-700 font-medium" : "text-slate-400"}`}>
                        Host: {game.hostName}{iHosted ? " (You)" : ""}
                      </span>
                    )}
                  </div>
                  <div className="divide-y divide-slate-100 bg-white">
                    {sorted.map((s) => {
                      const isMe = currentUser?.name === s.playerName;
                      return (
                        <div key={s.playerId || s.playerName}
                          className={`flex items-center justify-between px-5 py-2.5 ${isMe ? "bg-amber-50" : ""}`}>
                          <span className={`text-sm ${isMe ? "font-semibold text-amber-800" : "text-slate-700"}`}>
                            {s.playerName}
                            {isMe && <span className="ml-2 text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">You</span>}
                          </span>
                          <ScoreCell value={s.score} />
                        </div>
                      );
                    })}
                  </div>
                  <GamePhotos game={game} onAdd={(b64) => addGamePhoto(game.id, b64)} onRemove={(i) => removeGamePhoto(game.id, i)} />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
