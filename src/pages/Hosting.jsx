import { useStore } from "../context/GameStoreContext";
import { useAuth } from "../context/AuthContext";
import { formatDateLong } from "../utils/statsCalculations";

export default function Hosting() {
  const {
    hosting, rsvps, setRsvp, removeRsvp,
    sessions, checkInToSession, requestRebuy,
    settings,
  } = useStore();
  const { currentUser } = useAuth();

  const next = hosting.find((h) => h.status === "next");
  const upcoming = hosting.filter((h) => h.status === "upcoming");
  const past = hosting.filter((h) => h.status === "past").reverse();

  const iAmNext = currentUser?.name === next?.playerName;

  // RSVP data for the next game
  const maxPlayers = settings?.maxPlayers ?? 9;
  const nextRsvps = next ? rsvps.filter((r) => r.hostingId === next.id) : [];
  const inList = nextRsvps.filter((r) => r.status === "in");
  const outList = nextRsvps.filter((r) => r.status === "out");
  const standbyList = nextRsvps
    .filter((r) => r.status === "standby")
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  const isFull = inList.length >= maxPlayers;
  const spotsLeft = maxPlayers - inList.length;
  const myRsvp = currentUser
    ? nextRsvps.find((r) => r.playerId === currentUser.id)
    : null;
  const myStandbyPos = myRsvp?.status === "standby"
    ? standbyList.findIndex((r) => r.playerId === currentUser?.id) + 1
    : null;
  const alertLabel = isFull
    ? "🚨🚨 FULL"
    : inList.length >= 8
    ? "🚨🚨"
    : inList.length >= 7
    ? "🚨"
    : "";

  function handleRsvp(status) {
    if (!currentUser || !next) return;
    if (myRsvp?.status === status) {
      removeRsvp(next.id, currentUser.id);
    } else {
      setRsvp(next.id, currentUser.id, currentUser.name, status);
    }
  }

  // Session for the next game
  const nextSession = next
    ? sessions.find((s) => s.hostingId === next.id)
    : null;
  const sessionActive = nextSession?.status === "active";

  const mySessionEntry = currentUser && nextSession
    ? nextSession.players.find((p) => p.playerId === currentUser.id)
    : null;

  const myPendingRebuy = currentUser && nextSession
    ? nextSession.rebuyRequests.find(
        (r) => r.playerId === currentUser.id && r.status === "pending"
      )
    : null;

  function handleCheckIn() {
    if (!currentUser || !nextSession) return;
    checkInToSession(nextSession.id, currentUser.id, currentUser.name);
  }

  function handleRequestRebuy() {
    if (!currentUser || !nextSession) return;
    requestRebuy(nextSession.id, currentUser.id, currentUser.name);
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
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-semibold text-slate-700 text-base">Next Game RSVP</h2>
            {next.rsvpOpen && alertLabel && (
              <span className="text-sm font-bold text-red-600">{alertLabel}</span>
            )}
          </div>

          {/* Progress bar — only if rsvpOpen */}
          {next.rsvpOpen && (
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
          )}

          {/* Toggle buttons — only shown if rsvpOpen is true */}
          {next.rsvpOpen ? (
            !currentUser ? (
              <p className="text-xs text-slate-400">Sign in to RSVP</p>
            ) : myRsvp?.status === "in" && isFull ? (
              <p className="text-sm font-semibold text-green-600">✅ Your spot is confirmed!</p>
            ) : isFull ? (
              myRsvp?.status === "standby" ? (
                <div className="space-y-2">
                  <p className="text-sm text-amber-600 font-medium">
                    ⏳ You're on standby{myStandbyPos ? ` (#${myStandbyPos})` : ""} — you'll be notified if a spot opens
                  </p>
                  <button
                    onClick={() => removeRsvp(next.id, currentUser.id)}
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
            )
          ) : (
            <p className="text-xs text-gray-400 italic">RSVP not yet open for this game</p>
          )}

          {/* In / Out / Standby columns */}
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

          {/* Standby list */}
          {standbyList.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                ⏳ Standby ({standbyList.length})
              </p>
              <ul className="space-y-1">
                {standbyList.map((r, idx) => {
                  const isMe = currentUser?.id === r.playerId;
                  return (
                    <li key={r.id} className="flex items-center gap-1.5 text-sm">
                      <span className="text-slate-400 text-xs w-4">#{idx + 1}</span>
                      <span className={isMe ? "font-semibold text-amber-600" : "text-slate-600"}>
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
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Live Game Section */}
      {nextSession && sessionActive && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-5">
          <h2 className="font-semibold text-slate-700 text-base">🃏 Live Game</h2>

          {/* Check-in / rebuy area */}
          {!currentUser ? (
            <p className="text-sm text-slate-400">Sign in to check in</p>
          ) : !mySessionEntry ? (
            /* Not yet checked in */
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 text-center space-y-3">
              <p className="text-xl font-bold text-indigo-700">🃏 Game is Live!</p>
              <button
                onClick={handleCheckIn}
                className="w-full py-4 text-lg font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
              >
                I'm In!
              </button>
              <p className="text-xs text-indigo-500">Joining costs 1 buy-in · 50 NIS · 100 chips</p>
            </div>
          ) : (
            /* Already checked in */
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
              <div className="text-center">
                <p className="text-4xl font-bold text-slate-800">{mySessionEntry.buys} V</p>
                <p className="text-sm text-slate-500 mt-1">
                  = {mySessionEntry.buys * 50} NIS · {mySessionEntry.buys * 100} chips
                </p>
              </div>
              <button
                onClick={handleRequestRebuy}
                disabled={!!myPendingRebuy}
                className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  myPendingRebuy
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
              >
                Request Rebuy (+50 NIS / +100 chips)
              </button>
              {myPendingRebuy && (
                <p className="text-xs text-amber-600 text-center">⏳ Rebuy request pending admin approval</p>
              )}
            </div>
          )}

          {/* Player list */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Players ({nextSession.players.length})
            </p>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                    <th className="px-4 py-2.5 text-left">Name</th>
                    <th className="px-4 py-2.5 text-right">Buys (V)</th>
                    <th className="px-4 py-2.5 text-right">NIS</th>
                    <th className="px-4 py-2.5 text-right">Chips</th>
                  </tr>
                </thead>
                <tbody>
                  {nextSession.players.map((p) => {
                    const isMe = currentUser?.id === p.playerId;
                    return (
                      <tr
                        key={p.playerId}
                        className={`border-t border-slate-100 ${isMe ? "bg-amber-50" : ""}`}
                      >
                        <td className="px-4 py-2.5 font-medium text-slate-800">
                          <span className={isMe ? "text-amber-700" : ""}>{p.playerName}</span>
                          {isMe && (
                            <span className="ml-2 text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-medium">
                              You
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-700">{p.buys}</td>
                        <td className="px-4 py-2.5 text-right text-slate-700">{p.buys * 50}</td>
                        <td className="px-4 py-2.5 text-right text-slate-700">{p.buys * 100}</td>
                      </tr>
                    );
                  })}
                  {nextSession.players.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                        No players checked in yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
