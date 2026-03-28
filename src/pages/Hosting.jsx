import { useStore } from "../context/GameStoreContext";
import { useAuth } from "../context/AuthContext";
import { formatDateLong } from "../utils/statsCalculations";

export default function Hosting() {
  const { hosting, rsvps, setRsvp, removeRsvp } = useStore();
  const { currentUser } = useAuth();

  const next = hosting.find((h) => h.status === "next");
  const upcoming = hosting.filter((h) => h.status === "upcoming");
  const past = hosting.filter((h) => h.status === "past").reverse();

  const iAmNext = currentUser?.name === next?.playerName;

  // RSVP data for the next game
  const nextRsvps = next ? rsvps.filter((r) => r.hostingId === next.id) : [];
  const inList = nextRsvps.filter((r) => r.status === "in");
  const outList = nextRsvps.filter((r) => r.status === "out");
  const myRsvp = currentUser
    ? nextRsvps.find((r) => r.playerId === currentUser.id)
    : null;

  function handleRsvp(status) {
    if (!currentUser || !next) return;
    if (myRsvp?.status === status) {
      removeRsvp(next.id, currentUser.id);
    } else {
      setRsvp(next.id, currentUser.id, currentUser.name, status);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Game Hosting Schedule</h1>
        <p className="text-slate-500 text-sm">See who's hosting the next game</p>
      </div>

      {/* Next Host hero card */}
      {next && (
        <div className={`text-white rounded-xl p-6 shadow-lg ${
          iAmNext
            ? "bg-gradient-to-br from-amber-500 to-amber-600"
            : "bg-gradient-to-br from-indigo-600 to-indigo-700"
        }`}>
          <p className={`text-sm font-medium uppercase tracking-wide mb-1 ${iAmNext ? "text-amber-100" : "text-indigo-200"}`}>
            {iAmNext ? "🎉 You're Hosting Next!" : "Next Host"}
          </p>
          <p className="text-4xl font-bold mb-1">{next.playerName}</p>
          <p className={iAmNext ? "text-amber-100" : "text-indigo-200"}>{formatDateLong(next.date)}</p>
        </div>
      )}

      {/* RSVP Section — next game only */}
      {next && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
          <h2 className="font-semibold text-slate-700 text-base">Next Game RSVP</h2>

          {/* Toggle buttons */}
          {currentUser ? (
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
          ) : (
            <p className="text-xs text-slate-400">Sign in to RSVP</p>
          )}

          {/* In / Out columns */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                ✅ In ({inList.length})
              </p>
              <ul className="space-y-1">
                {inList.map((r) => {
                  const isMe = currentUser?.id === r.playerId;
                  return (
                    <li key={r.id} className="flex items-center gap-1.5 text-sm">
                      <span className={isMe ? "font-semibold text-amber-600" : "text-slate-700"}>
                        {r.playerName}
                      </span>
                      {isMe && (
                        <span className="text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-medium">
                          You
                        </span>
                      )}
                    </li>
                  );
                })}
                {inList.length === 0 && (
                  <li className="text-xs text-slate-400 italic">No one yet</li>
                )}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                ❌ Out ({outList.length})
              </p>
              <ul className="space-y-1">
                {outList.map((r) => {
                  const isMe = currentUser?.id === r.playerId;
                  return (
                    <li key={r.id} className="flex items-center gap-1.5 text-sm">
                      <span className={isMe ? "font-semibold text-amber-600" : "text-slate-500"}>
                        {r.playerName}
                      </span>
                      {isMe && (
                        <span className="text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-medium">
                          You
                        </span>
                      )}
                    </li>
                  );
                })}
                {outList.length === 0 && (
                  <li className="text-xs text-slate-400 italic">No one yet</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-700">Upcoming Hosts</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Host</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {[...(next ? [next] : []), ...upcoming].map((h) => {
                const isMe = currentUser?.name === h.playerName;
                return (
                  <tr key={h.id} className={`border-b border-slate-100 last:border-0 ${isMe ? "bg-amber-50" : ""}`}>
                    <td className="px-4 py-3 text-slate-600">{formatDateLong(h.date)}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {h.playerName}
                      {isMe && <span className="ml-2 text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-medium">You</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        h.status === "next"
                          ? isMe ? "bg-amber-200 text-amber-800" : "bg-indigo-100 text-indigo-700"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {h.status === "next" ? "Next" : "Upcoming"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {!next && upcoming.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">No upcoming hosts scheduled</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Past */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-700">Past Hosts</h2>
          </div>
          <div className="overflow-y-auto max-h-80">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Host</th>
                </tr>
              </thead>
              <tbody>
                {past.map((h) => {
                  const isMe = currentUser?.name === h.playerName;
                  return (
                    <tr key={h.id} className={`border-b border-slate-100 last:border-0 ${
                      isMe ? "bg-amber-50" : "odd:bg-white even:bg-slate-50/40"
                    }`}>
                      <td className="px-4 py-2.5 text-slate-500">{formatDateLong(h.date)}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-700">
                        {h.playerName}
                        {isMe && <span className="ml-2 text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-medium">You</span>}
                      </td>
                    </tr>
                  );
                })}
                {past.length === 0 && (
                  <tr><td colSpan={2} className="px-4 py-6 text-center text-slate-400">No past hosts yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
