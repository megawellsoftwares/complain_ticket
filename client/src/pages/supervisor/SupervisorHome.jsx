import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api.js";
import { AppLayout } from "../../components/AppLayout.jsx";
import { KanbanBoard } from "../../components/KanbanBoard.jsx";
import { StatisticsCard } from "../../components/StatisticsCard.jsx";

const KANBAN_COLUMNS = ["received", "seen-supervisor", "dispatched", "seen-agent", "in-progress", "pending-confirmation", "fermer"];

export default function SupervisorHome() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [tRes, sRes] = await Promise.all([
          api("/ticket"),
          api("/stats/general")
        ]);
        setTickets(tRes.data || []);
        setStats(sRes.data);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AppLayout title="Supervisor Dashboard">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ margin: 0 }}>Department Tickets ({tickets.length})</h2>
        <Link to="/requester/new" className="btn btn-primary">
          + New Ticket
        </Link>
      </div>
      {err ? <div className="error-banner">{err}</div> : null}
      
      <StatisticsCard stats={stats} />

      {loading ? (
        <p className="muted">Loading tickets...</p>
      ) : (
        <KanbanBoard 
          tickets={tickets} 
          linkPrefix="/supervisor/ticket" 
          columns={KANBAN_COLUMNS} 
          emptyMessage="No tickets in your department." 
        />
      )}
    </AppLayout>
  );
}
