import { useEffect, useState } from "react";

import { api } from "../api";
import { useAuth } from "../AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [count, setCount] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/expenses/")
      .then((list) => setCount(list.length))
      .catch((err) => setError(err.message));
  }, []);

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
        <h1>Welcome</h1>
        {error && <p className="error">{error}</p>}
        {count !== null && (
          <p>
            You have {count} saved expense(s). The expense list and chart come
            next.
          </p>
        )}
      </main>
    </>
  );
}