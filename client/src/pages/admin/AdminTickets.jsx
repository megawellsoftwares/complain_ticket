import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../../api.js";
import { AppLayout } from "../../components/AppLayout.jsx";
import { KanbanBoard } from "../../components/KanbanBoard.jsx";

export default function AdminTickets() {
  const loc = useLocation();
  const readOnly = loc.pathname.startsWith("/superadmin");
  const linkPrefix = readOnly ? "/superadmin/ticket" : "/admin/ticket";
  const title = readOnly ? "All tickets (read-only)" : "All tickets";
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
    <AppLayout title={title}>
      {readOnly ? <p className="muted">Super-admin: view-only access. No changes can be made from this account.</p> : null}
      {err ? <div className="error-banner">{err}</div> : null}
      <KanbanBoard tickets={tickets} linkPrefix={linkPrefix} emptyMessage="No tickets in the system." />
    </AppLayout>
  );
}
