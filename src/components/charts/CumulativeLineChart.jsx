import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from "recharts";
import { playerColor } from "../../utils/statsCalculations";

export default function CumulativeLineChart({ data, players, selectedPlayer, loggedInPlayer }) {
  // data: [{ dateLabel, PlayerName: cumulativeScore, ... }]
  const visiblePlayers = selectedPlayer
    ? players.filter((p) => p.name === selectedPlayer)
    : players;

  return (
    <ResponsiveContainer width="100%" height={380}>
      <LineChart data={data} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
        <XAxis dataKey="dateLabel" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip
          formatter={(v, name) => [v > 0 ? `+${v}` : v, name]}
          contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />
        {visiblePlayers.map((p) => {
          const isLoggedIn = loggedInPlayer && p.name === loggedInPlayer;
          return (
            <Line
              key={p.name}
              type="monotone"
              dataKey={p.name}
              stroke={isLoggedIn ? "#000000" : playerColor(p.name)}
              strokeWidth={isLoggedIn ? 3.5 : selectedPlayer ? 2.5 : 1.5}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );
}
