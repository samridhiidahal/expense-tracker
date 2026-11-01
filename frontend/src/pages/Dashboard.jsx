import { useCallback, useEffect, useState } from "react";

import { api } from "../api";
import { useAuth } from "../AuthContext";
import ExpenseForm from "../components/ExpenseForm";
import { formatAmount, formatDate } from "../format";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [month, setMonth] = useState("");
  const [category, setCategory] = useState("");
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    const params = new URLSearchParams({ limit: "500" });
    if (month) params.set("month", month);
    if (category) params.set("category", category);

    try {
      const [list, names] = await Promise.all([
        api(`/expenses/?${params}`),
        api("/expenses/categories"),
      ]);
      setExpenses(list);
      setCategories(names);
      setError("");
      // If the selected category no longer exists, drop the filter
      if (category && !names.includes(category)) setCategory("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [month, category]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function handleSave(payload) {
    if (editing) {
      await api(`/expenses/${editing.id}`, { method: "PATCH", json: payload });
      setEditing(null);
    } else {
      await api("/expenses/", { method: "POST", json: payload });
    }
    await reload();
  }

  async function handleDelete(expense) {
    if (!window.confirm(`Delete "${expense.title}"?`)) return;
    try {
      await api(`/expenses/${expense.id}`, { method: "DELETE" });
      if (editing?.id === expense.id) setEditing(null);
      await reload();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(expense) {
    setEditing(expense);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearFilters() {
    setMonth("");
    setCategory("");
  }

  const total = expenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <>
      <header className="topbar">
        <h2>Expense Tracker</h2>
        <div className="right">
          <span>{user.email}</span>
          <button className="ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <main className="page">
        {error && <p className="error">{error}</p>}

        <ExpenseForm
          key={editing ? editing.id : "new"}
          initial={editing}
          categories={categories}
          onSubmit={handleSave}
          onCancel={() => setEditing(null)}
        />

        <section className="card">
          <h3>Your expenses</h3>

          <div className="filters">
            <label>
              Month
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </label>
            <label>
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            {(month || category) && (
              <button className="ghost" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>

          {loading ? (
            <p className="empty">Loading...</p>
          ) : expenses.length === 0 ? (
            <p className="empty">
              {month || category
                ? "No expenses match these filters."
                : "No expenses yet. Add your first one above."}
            </p>
          ) : (
            <>
              <p className="list-meta">
                {expenses.length} expense(s) &middot; Total{" "}
                <strong>{formatAmount(total)}</strong>
              </p>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th className="num">Amount</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((item) => (
                      <tr
                        key={item.id}
                        className={editing?.id === item.id ? "editing" : ""}
                      >
                        <td>{formatDate(item.expense_date)}</td>
                        <td>{item.title}</td>
                        <td>
                          <span className="tag">{item.category}</span>
                        </td>
                        <td className="num">{formatAmount(item.amount)}</td>
                        <td>
                          <div className="row-actions">
                            <button
                              className="ghost"
                              onClick={() => startEdit(item)}
                            >
                              Edit
                            </button>
                            <button
                              className="danger"
                              onClick={() => handleDelete(item)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </main>
    </>
  );
}