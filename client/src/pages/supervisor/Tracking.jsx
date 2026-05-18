import { useEffect, useState } from "react";
import { api } from "../../api.js";
import { AppLayout } from "../../components/AppLayout.jsx";
import { KanbanBoard } from "../../components/KanbanBoard.jsx";

const TRACKING_COLUMNS = [
  "received",
  "seen-supervisor",
  "dispatched",
  "seen-agent",
  "in-progress",
  "pending-confirmation",
  "fermer",
];

export default function SupervisorTracking() {
  const [tickets, setTickets] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api("/ticket/all");
        setTickets(res.data || []);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  return (
    <AppLayout title="Full tracking">
      {err ? <div className="error-banner">{err}</div> : null}
      <p className="muted">All tickets for your serving department, grouped by workflow status.</p>
      <KanbanBoard tickets={tickets} linkPrefix="/supervisor/ticket" columns={TRACKING_COLUMNS} emptyMessage="No tickets in your department." />
    </AppLayout>
  );
}
