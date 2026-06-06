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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.08)" />
                <XAxis dataKey={nameKey} tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey={dataKey} stroke="#2563eb" strokeWidth={3} dot={false} />
              </LineChart>
            ) : type === "pie" ? (
              <PieChart>
                <Tooltip />
                <Pie data={data} dataKey={dataKey} nameKey={nameKey} innerRadius={60} outerRadius={100} paddingAngle={4}>
                  {data.map((entry, index) => (
                    <Cell key={entry[nameKey] || index} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
              </PieChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.08)" />
                <XAxis dataKey={nameKey} tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey={dataKey} radius={[8, 8, 0, 0]} fill="#0f766e" />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

export default AnalyticsChart;
