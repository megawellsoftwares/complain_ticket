import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api.js";
import { AppLayout } from "../../components/AppLayout.jsx";
import { StatisticsCard } from "../../components/StatisticsCard.jsx";

export default function SuperadminHome() {
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const sRes = await api("/stats/general");
        setStats(sRes.data);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  return (
    <AppLayout title="Super-admin (read-only)">
      {err ? <div className="error-banner">{err}</div> : null}
      <StatisticsCard stats={stats} />
      <p className="muted">This role can browse the system but cannot create, update, or delete records.</p>
      <div className="grid2">
        <Link to="/superadmin/tickets" className="card" style={{ textDecoration: "none", color: "inherit" }}>
          <h3 style={{ margin: "0 0 0.5rem" }}>All tickets</h3>
          <p className="muted" style={{ margin: 0 }}>
            Kanban view across every department.
          </p>
        </Link>
        <Link to="/superadmin/users" className="card" style={{ textDecoration: "none", color: "inherit" }}>
          <h3 style={{ margin: "0 0 0.5rem" }}>Users</h3>
          <p className="muted" style={{ margin: 0 }}>
            Directory of accounts (no edits).
          </p>
        </Link>
      </div>
    </AppLayout>
  );
}
