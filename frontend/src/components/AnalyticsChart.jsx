import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";

const colors = ["#0f766e", "#2563eb", "#7c3aed", "#ea580c", "#16a34a", "#db2777"];
const axisProps = {
  tickLine: false,
  axisLine: false,
  tick: { fill: "var(--muted)", fontSize: 12 }
};
const tooltipProps = {
  contentStyle: {
    background: "var(--surface-raised)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    color: "var(--text)"
  },
  labelStyle: {
    color: "var(--text-strong)"
  }
};

function AnalyticsChart({ title, type = "bar", data = [], dataKey = "total", nameKey = "label", height = 280 }) {
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <section className="chart-card">
      <div className="section-heading">
        <h3>{title}</h3>
      </div>

      <div className="chart-card__canvas" style={{ height }}>
        {!hasData ? (
          <div className="empty-state">
            <p>No chart data available yet.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {type === "line" ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey={nameKey} {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip {...tooltipProps} />
                <Line type="monotone" dataKey={dataKey} stroke="var(--accent)" strokeWidth={3} dot={false} />
              </LineChart>
            ) : type === "pie" ? (
              <PieChart>
                <Tooltip {...tooltipProps} />
                <Pie data={data} dataKey={dataKey} nameKey={nameKey} innerRadius={60} outerRadius={100} paddingAngle={4}>
                  {data.map((entry, index) => (
                    <Cell key={entry[nameKey] || index} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
              </PieChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey={nameKey} {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip {...tooltipProps} />
                <Bar dataKey={dataKey} radius={[8, 8, 0, 0]} fill="var(--primary)" />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

export default AnalyticsChart;
