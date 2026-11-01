import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { api } from "../api";
import {
  currentMonth,
  formatAmount,
  monthLabel,
  recentMonths,
  shortMonth,
} from "../format";

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#65a30d",
];

export default function SummaryPanel({ refreshKey }) {
  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!month) return;
    let cancelled = false;
    const months = recentMonths(month, 6);

    Promise.all(months.map((m) => api(`/expenses/summary?month=${m}`)))
      .then((results) => {
        if (cancelled) return;
        // The last result is the selected month, so no extra request is needed
        setSummary(results[results.length - 1]);
        setTrend(
          results.map((item, index) => ({
            month: shortMonth(months[index]),
            total: item.total,
          }))
        );
        setError("");
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [month, refreshKey]);

  const pieData = summary
    ? summary.by_category.map((item) => ({
        name: item.category,
        value: item.total,
      }))
    : [];
  const top = summary?.by_category[0];

  return (
    <section className="card">
      <div className="summary-head">
        <h3>{month ? `Summary for ${monthLabel(month)}` : "Summary"}</h3>
        <label>
          Month
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </label>
      </div>

      {error && <p className="error">{error}</p>}

      {!month ? (
        <p className="empty">Pick a month to see its summary.</p>
      ) : !summary ? (
        <p className="empty">Loading...</p>
      ) : (
        <>
          <div className="stats">
            <div className="stat">
              <div className="label">Total spent</div>
              <div className="value">{formatAmount(summary.total)}</div>
            </div>
            <div className="stat">
              <div className="label">Expenses</div>
              <div className="value">{summary.count}</div>
            </div>
            <div className="stat">
              <div className="label">Top category</div>
              <div className="value">{top ? top.category : "-"}</div>
              {top && <div className="sub">{formatAmount(top.total)}</div>}
            </div>
          </div>

          <div className="charts">
            <div>
              <h4 className="chart-title">Spending by category</h4>
              {summary.count === 0 ? (
                <p className="empty">No expenses in this month.</p>
              ) : (
                <>
                  <div className="chart-box">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={2}
                        >
                          {pieData.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatAmount(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="legend">
                    {pieData.map((entry, index) => (
                      <li key={entry.name}>
                        <span
                          className="dot"
                          style={{
                            background: COLORS[index % COLORS.length],
                          }}
                        />
                        <span className="name">{entry.name}</span>
                        <span>{formatAmount(entry.value)}</span>
                        <span className="pct">
                          {Math.round((entry.value / summary.total) * 100)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div>
              <h4 className="chart-title">Last 6 months</h4>
              <div className="chart-box">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis width={55} />
                    <Tooltip formatter={(value) => formatAmount(value)} />
                    <Bar
                      dataKey="total"
                      fill="#2563eb"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}