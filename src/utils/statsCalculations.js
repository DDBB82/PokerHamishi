// Pure stat computation — no React imports, no side effects.

/**
 * Compute per-player stats from raw players + games arrays.
 * Returns a Map<playerId, stats> AND an array sorted by totalScore descending.
 */
export function computePlayerStats(players, games) {
  const sorted = [...games].sort((a, b) => new Date(a.date) - new Date(b.date));

  const map = new Map();
  for (const p of players) {
    map.set(p.id, {
      playerId: p.id,
      name: p.name,
      photoBase64: p.photoBase64 || null,
      totalScore: 0,
      gamesPlayed: 0,
      bestWin: null,
      worstLoss: null,
      recentScore: null,
      recentDate: null,
      chronoScores: [],
    });
  }

  for (const game of sorted) {
    for (const s of game.scores) {
      let stats = map.get(s.playerId);
      if (!stats) {
        // Player removed from roster but still in history — create ephemeral entry
        stats = {
          playerId: s.playerId,
          name: s.playerName,
          photoBase64: null,
          totalScore: 0,
          gamesPlayed: 0,
          bestWin: null,
          worstLoss: null,
          recentScore: null,
          recentDate: null,
          chronoScores: [],
        };
        map.set(s.playerId, stats);
      }
      stats.totalScore += s.score;
      stats.gamesPlayed += 1;
      stats.bestWin = stats.bestWin === null ? s.score : Math.max(stats.bestWin, s.score);
      stats.worstLoss = stats.worstLoss === null ? s.score : Math.min(stats.worstLoss, s.score);
      stats.recentScore = s.score;
      stats.recentDate = game.date;
      stats.chronoScores.push(s.score);
    }
  }

  const result = [];
  for (const [, stats] of map) {
    stats.avgScore =
      stats.gamesPlayed > 0
        ? parseFloat((stats.totalScore / stats.gamesPlayed).toFixed(1))
        : 0;

    // Streaks
    let curWin = 0, curLoss = 0, bestStreak = 0, worstStreak = 0;
    for (const sc of stats.chronoScores) {
      if (sc > 0) {
        curWin++; curLoss = 0;
        if (curWin > bestStreak) bestStreak = curWin;
      } else {
        curLoss++; curWin = 0;
        if (curLoss > worstStreak) worstStreak = curLoss;
      }
    }
    stats.bestWinStreak = bestStreak;
    stats.worstLossStreak = worstStreak;
    delete stats.chronoScores;

    result.push(stats);
  }

  result.sort((a, b) => b.totalScore - a.totalScore);
  return result;
}

/**
 * Returns array of { dateLabel, [playerName]: cumulativeScore } for Recharts.
 * dateLabel is like "Jan 1".
 */
export function computeCumulativeScores(players, games) {
  const sorted = [...games].sort((a, b) => new Date(a.date) - new Date(b.date));
  const running = {};
  for (const p of players) running[p.name] = 0;

  const points = [];
  for (const game of sorted) {
    const label = formatDateShort(game.date);
    for (const s of game.scores) {
      if (running[s.playerName] !== undefined) {
        running[s.playerName] += s.score;
      } else {
        running[s.playerName] = s.score;
      }
    }
    points.push({ dateLabel: label, date: game.date, ...running });
  }
  return points;
}

/** Filter games to a specific year+month (1-indexed). */
export function getGamesByMonth(games, year, month) {
  return games.filter((g) => {
    const d = new Date(g.date);
    return d.getUTCFullYear() === year && d.getUTCMonth() + 1 === month;
  });
}

/** Monthly rankings for a given year+month. */
export function computeMonthlyRankings(players, games, year, month) {
  const monthGames = getGamesByMonth(games, year, month);
  const totals = {};
  const counts = {};

  for (const game of monthGames) {
    for (const s of game.scores) {
      totals[s.playerName] = (totals[s.playerName] || 0) + s.score;
      counts[s.playerName] = (counts[s.playerName] || 0) + 1;
    }
  }

  return Object.entries(totals)
    .map(([name, total]) => ({ name, total, gamesPlayed: counts[name] || 0 }))
    .sort((a, b) => b.total - a.total);
}

/** Get distinct year-month values from games, sorted descending. */
export function getDistinctMonths(games) {
  const set = new Set();
  for (const g of games) {
    const d = new Date(g.date);
    set.add(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return [...set].sort().reverse();
}

/** Format an ISO date string to "Mar 26, 2026". */
export function formatDateLong(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}

/** Format an ISO date string to "Mar 26". */
export function formatDateShort(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/** Format "2026-03" -> "March 2026". */
export function formatYearMonth(ym) {
  const [year, month] = ym.split("-");
  const d = new Date(parseInt(year), parseInt(month) - 1, 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** Returns initials from a name, e.g. "Bruno" -> "BR". */
export function getInitials(name) {
  return name.slice(0, 2).toUpperCase();
}

/** Deterministic color per player name from a palette of 12. */
const PALETTE = [
  "#6366f1","#10b981","#f59e0b","#ef4444","#3b82f6","#8b5cf6",
  "#ec4899","#14b8a6","#f97316","#84cc16","#06b6d4","#a855f7",
];
export function playerColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
