import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine, ResponsiveContainer,
} from "recharts";
import { playerColor } from "../../utils/statsCalculations";

export default function PlayerBarChart({ data, highlightId }) {
  // data: [{ playerId, name, totalScore }]
  const sorted = [...data].sort((a, b) => b.totalScore - a.totalScore);
  const height = Math.max(200, sorted.length * 42);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={sorted} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
        <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={60}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(v) => [v > 0 ? `+${v}` : v, "Total Score"]}
          contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
        />
        <ReferenceLine x={0} stroke="#94a3b8" strokeWidth={1} />
        <Bar dataKey="totalScore" radius={[0, 4, 4, 0]} maxBarSize={28}>
          {sorted.map((entry) => (
            <Cell
              key={entry.playerId}
              fill={
                highlightId && entry.playerId !== highlightId
                  ? "#e2e8f0"
                  : entry.totalScore >= 0
                  ? "#22c55e"
                  : "#ef4444"
              }
              opacity={highlightId && entry.playerId !== highlightId ? 0.4 : 1}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
