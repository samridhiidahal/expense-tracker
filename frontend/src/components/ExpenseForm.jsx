import { useState } from "react";

import { today } from "../format";

export default function ExpenseForm({
  initial,
  categories,
  onSubmit,
  onCancel,
}) {
  const isEdit = Boolean(initial);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [expenseDate, setExpenseDate] = useState(
    initial?.expense_date ?? today()
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }

    setBusy(true);
    try {
      await onSubmit({
        title: title.trim(),
        amount: value,
        category: category.trim(),
        expense_date: expenseDate,
      });
      if (!isEdit) {
        setTitle("");
        setAmount("");
        setCategory("");
        setExpenseDate(today());
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h3>{isEdit ? "Edit expense" : "Add expense"}</h3>
      {error && <p className="error">{error}</p>}

      <div className="form-grid">
        <label>
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            placeholder="e.g. Lunch"
            required
          />
        </label>
        <label>
          Amount (Rs)
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </label>
        <label>
          Category
          <input
            list="category-options"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            maxLength={50}
            placeholder="e.g. Food"
            required
          />
        </label>
        <label>
          Date
          <input
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            required
          />
        </label>
      </div>

      <datalist id="category-options">
        {categories.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <div className="form-actions">
        <button type="submit" disabled={busy}>
          {busy ? "Saving..." : isEdit ? "Save changes" : "Add expense"}
        </button>
        {isEdit && (
          <button type="button" className="ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}