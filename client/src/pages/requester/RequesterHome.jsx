import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api.js";
import { AppLayout } from "../../components/AppLayout.jsx";
import { KanbanBoard } from "../../components/KanbanBoard.jsx";
import { normalizeStatusForRequester } from "../../components/ticketUtils.jsx";
import { useAuth } from "../../auth/AuthContext.jsx";

const REQUESTER_COLUMNS = ["received", "seen", "in-progress", "pending-confirmation", "fermer"];

export default function RequesterHome() {
  const [tickets, setTickets] = useState([]);
  const [err, setErr] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const res = await api("/ticket/my");
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
        // only add if this requester created it
        if (!user) return;
        const requesterId = t.requester?._id || t.requester;
        if (String(requesterId) === String(user._id)) setTickets((prev) => [t, ...(prev || [])]);
      });
      socket.on("ticket:updated", (t) => {
        if (!mounted) return;
        if (!user) return;
        const requesterId = t.requester?._id || t.requester;
        if (String(requesterId) !== String(user._id)) return;
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
  }, [user]);

  return (
    <AppLayout title="My tickets">
      {err ? <div className="error-banner">{err}</div> : null}
      <div style={{ marginBottom: "1rem" }}>
        <Link to="/requester/new" className="btn btn-primary">
          New ticket
        </Link>
      </div>
      <KanbanBoard
        tickets={tickets}
        linkPrefix="/requester/ticket"
        columns={REQUESTER_COLUMNS}
        normalizeFn={normalizeStatusForRequester}
        emptyMessage="No tickets yet — create one to get started."
      />
    </AppLayout>
  );
}
