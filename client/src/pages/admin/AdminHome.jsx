import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api.js";
import { AppLayout } from "../../components/AppLayout.jsx";
import { StatisticsCard } from "../../components/StatisticsCard.jsx";

export default function AdminHome() {
  const [counts, setCounts] = useState({ users: "—", tickets: "—" });
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const usersRaw = await api("/user");
        const users = Array.isArray(usersRaw) ? usersRaw : usersRaw?.data || [];
        const sRes = await api("/stats/general");
        setStats(sRes.data);
        setCounts({ users: users.length, tickets: sRes.data?.totalTickets || 0 });
      } catch {
        setCounts({ users: "?", tickets: "?" });
      }
    })();
  }, []);

  return (
    <AppLayout title="Admin overview">
      <StatisticsCard stats={stats} />
      <div className="grid2">
        <div className="card">
          <h3 style={{ margin: "0 0 0.5rem" }}>Users</h3>
          <p className="muted" style={{ margin: 0 }}>
            Total accounts: <strong>{counts.users}</strong>
          </p>
          <Link to="/admin/users" className="btn btn-primary" style={{ marginTop: "1rem" }}>
            Manage users
          </Link>
        </div>
        <div className="card">
          <h3 style={{ margin: "0 0 0.5rem" }}>Tickets</h3>
          <p className="muted" style={{ margin: 0 }}>
            Total tickets: <strong>{counts.tickets}</strong>
          </p>
          <Link to="/admin/tickets" className="btn btn-primary" style={{ marginTop: "1rem" }}>
            View all tickets
          </Link>
        </div>
        <div className="card">
          <h3 style={{ margin: "0 0 0.5rem" }}>Structure</h3>
          <p className="muted" style={{ margin: 0 }}>Departments and problem catalog.</p>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
            <Link to="/admin/departments" className="btn btn-primary">
              Departments
            </Link>
            <Link to="/admin/problems" className="btn btn-primary">
              Problems
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
