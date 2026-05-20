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
    <AppLayout title={title}>
      {readOnly ? <p className="muted">Super-admin: view-only access. No changes can be made from this account.</p> : null}
      {err ? <div className="error-banner">{err}</div> : null}
      <KanbanBoard tickets={tickets} linkPrefix={linkPrefix} emptyMessage="No tickets in the system." />
    </AppLayout>
  );
}
