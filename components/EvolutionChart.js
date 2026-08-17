import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Card from "components/Card.js";

const BOUNDARIES = [
  { value: 18.5, label: "18.5" },
  { value: 25, label: "25" },
  { value: 30, label: "30" },
  { value: 35, label: "35" },
  { value: 40, label: "40" },
];

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;

  return (
    <div className="rounded-lg border border-border bg-surface p-3 text-sm shadow-md">
      <p className="font-medium text-text">IMC {point.bmi.toFixed(2)}</p>
      <p className="text-text-muted">{point.classification}</p>
      <p className="text-xs text-text-muted">{point.date}</p>
    </div>
  );
}

function EvolutionChart({ evaluations }) {
  const data = [...evaluations]
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map((row) => ({
      date: new Date(row.created_at).toLocaleDateString("pt-BR"),
      bmi: row.bmi,
      classification: row.classification,
    }));

  const maxBmi = Math.max(...data.map((point) => point.bmi));

  return (
    <Card>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 16, bottom: 0, left: -16 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis
              domain={[15, Math.max(45, Math.ceil(maxBmi) + 2)]}
              tick={{ fontSize: 12 }}
            />
            {BOUNDARIES.map((boundary) => (
              <ReferenceLine
                key={boundary.value}
                y={boundary.value}
                stroke="var(--color-text-muted)"
                strokeDasharray="4 4"
                strokeOpacity={0.4}
                label={{
                  value: boundary.label,
                  position: "right",
                  fontSize: 10,
                  fill: "var(--color-text-muted)",
                }}
              />
            ))}
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone"
              dataKey="bmi"
              stroke="var(--color-primary)"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export default EvolutionChart;
