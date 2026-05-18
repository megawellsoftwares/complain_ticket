import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api.js";
import { AppLayout } from "../../components/AppLayout.jsx";
import { KanbanBoard } from "../../components/KanbanBoard.jsx";
import { normalizeStatusForRequester } from "../../components/ticketUtils.jsx";

const REQUESTER_COLUMNS = ["received", "in-progress", "pending-confirmation", "fermer"];

export default function RequesterHome() {
  const [tickets, setTickets] = useState([]);
  const [err, setErr] = useState("");

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
