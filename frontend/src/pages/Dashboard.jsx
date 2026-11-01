import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { api } from "../api";
import { useAuth } from "../AuthContext";
import ExpenseForm from "../components/ExpenseForm";
import { formatAmount, formatDate } from "../format";

const SummaryPanel = lazy(() => import("../components/SummaryPanel"));

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [month, setMonth] = useState("");
  const [category, setCategory] = useState("");
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [version, setVersion] = useState(0);
  const noticeTimer = useRef(null);

  function showNotice(text) {
    setNotice(text);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 3000);
  }

  useEffect(() => () => clearTimeout(noticeTimer.current), []);

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
    const wasEditing = Boolean(editing);
    if (wasEditing) {
      await api(`/expenses/${editing.id}`, { method: "PATCH", json: payload });
      setEditing(null);
    } else {
      await api("/expenses/", { method: "POST", json: payload });
    }
    await reload();
    setVersion((v) => v + 1);
    showNotice(wasEditing ? "Expense updated." : "Expense added.");
  }

  async function handleDelete(expense) {
    if (!window.confirm(`Delete "${expense.title}"?`)) return;
    setDeletingId(expense.id);
    try {
      await api(`/expenses/${expense.id}`, { method: "DELETE" });
      if (editing?.id === expense.id) setEditing(null);
      await reload();
      setVersion((v) => v + 1);
      showNotice("Expense deleted.");
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
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
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}

        <Suspense
          fallback={
            <section className="card">
              <p className="empty">Loading summary...</p>
            </section>
          }
        >
          <SummaryPanel refreshKey={version} />
        </Suspense>

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
                        <td data-label="Date">{formatDate(item.expense_date)}</td>
                        <td data-label="Title">{item.title}</td>
                        <td data-label="Category">
                          <span className="tag">{item.category}</span>
                        </td>
                        <td className="num" data-label="Amount">
                          {formatAmount(item.amount)}
                        </td>
                        <td className="actions-cell">
                          <div className="row-actions">
                            <button
                              className="ghost"
                              onClick={() => startEdit(item)}
                            >
                              Edit
                            </button>
                            <button
                              className="danger"
                              disabled={deletingId === item.id}
                              onClick={() => handleDelete(item)}
                            >
                              {deletingId === item.id ? "Deleting..." : "Delete"}
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