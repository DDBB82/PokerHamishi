import { useMemo, useRef } from "react";
import { useStore } from "../context/GameStoreContext";
import { computePlayerStats, getInitials, playerColor } from "../utils/statsCalculations";

function Avatar({ player, size = "lg", onUpload }) {
  const fileRef = useRef();
  const sz = size === "lg" ? "w-20 h-20 text-xl" : "w-12 h-12 text-sm";

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onUpload && onUpload(reader.result);
    reader.readAsDataURL(file);
  }

  return (
    <div className="relative group">
      {player.photoBase64 ? (
        <img
          src={player.photoBase64}
          alt={player.name}
          className={`${sz} rounded-full object-cover border-2 border-white shadow`}
        />
      ) : (
        <div
          className={`${sz} rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow`}
          style={{ backgroundColor: playerColor(player.name) }}
        >
          {getInitials(player.name)}
        </div>
      )}
      {onUpload && (
        <button
          onClick={() => fileRef.current.click()}
          className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium"
          title="Upload photo"
        >
          📷
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

export default function Players() {
  const { players, games, updatePlayerPhoto } = useStore();
  const statsArr = useMemo(() => computePlayerStats(players, games), [players, games]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Players</h1>
        <p className="text-slate-500 text-sm">View all registered players</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statsArr.map((s, idx) => {
          const player = players.find((p) => p.id === s.playerId) || { name: s.name, photoBase64: null, id: s.playerId };
          return (
            <div key={s.playerId} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <Avatar
                  player={player}
                  size="lg"
                  onUpload={player.id && players.some((p) => p.id === player.id)
                    ? (b64) => updatePlayerPhoto(player.id, b64)
                    : null}
                />
                <div>
                  <p className="font-bold text-slate-800 text-lg">{s.name}</p>
                  <p className="text-xs text-slate-400">#{idx + 1} overall</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <Stat label="Total Score" value={s.totalScore} colored />
                <Stat label="Games Played" value={s.gamesPlayed} />
                <Stat label="Average Score" value={s.avgScore} colored />
                <Stat label="Best Win" value={s.bestWin} colored />
                <Stat label="Worst Loss" value={s.worstLoss} colored />
                <Stat label="Win Streak" value={s.bestWinStreak} suffix=" games" />
                <Stat label="Loss Streak" value={s.worstLossStreak} suffix=" games" negative />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, colored, suffix, negative }) {
  const formatted =
    value === null || value === undefined
      ? "—"
      : colored
      ? value > 0
        ? `+${value}`
        : String(value)
      : `${value}${suffix || ""}`;

  const cls = colored
    ? value >= 0
      ? "text-green-600"
      : "text-red-500"
    : negative
    ? "text-red-400"
    : "text-slate-700";

  return (
    <div className="bg-slate-50 rounded-lg p-2">
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className={`font-semibold ${cls}`}>{formatted}</p>
    </div>
  );
}
