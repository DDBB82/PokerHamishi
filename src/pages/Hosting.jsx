import { useStore } from "../context/GameStoreContext";
import { useAuth } from "../context/AuthContext";
import { formatDateLong } from "../utils/statsCalculations";

export default function Hosting() {
  const { hosting } = useStore();
  const { currentUser } = useAuth();

  const next = hosting.find((h) => h.status === "next");
  const upcoming = hosting.filter((h) => h.status === "upcoming");
  const past = hosting.filter((h) => h.status === "past").reverse();

  const iAmNext = currentUser?.name === next?.playerName;

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
