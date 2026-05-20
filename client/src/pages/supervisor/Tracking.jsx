import { useEffect, useState } from "react";
import { api } from "../../api.js";
import { AppLayout } from "../../components/AppLayout.jsx";
import { KanbanBoard } from "../../components/KanbanBoard.jsx";

const TRACKING_COLUMNS = [
  "received",  "seen-admin",  "seen-supervisor",
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

  useEffect(() => {
    let mounted = true;
    import("../../socket.js").then(({ default: socket, connectSocket }) => {
      connectSocket();
      socket.on("ticket:created", (t) => {
        if (!mounted) return;
        setTickets((prev) => [t, ...(prev || [])]);
      });
      socket.on("ticket:updated", (t) => {
        if (!mounted) return;
        setTickets((prev) => {
          if (!prev) return [t];
          const idx = prev.findIndex((x) => x._id === t._id);
          if (idx === -1) return [t, ...prev];
          const copy = [...prev];
          copy[idx] = t;
          return copy;
        });
      });
    });
    return () => { mounted = false; };
  }, []);

  return (
    <AppLayout title="Full tracking">
      {err ? <div className="error-banner">{err}</div> : null}
      <p className="muted">All tickets for your serving department, grouped by workflow status.</p>
      <KanbanBoard tickets={tickets} linkPrefix="/supervisor/ticket" columns={TRACKING_COLUMNS} emptyMessage="No tickets in your department." />
    </AppLayout>
  );
}
