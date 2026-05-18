import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api.js";
import { AppLayout } from "../../components/AppLayout.jsx";
import { KanbanBoard } from "../../components/KanbanBoard.jsx";

const APPROVAL_COLUMNS = ["pending-responsible"];

export default function ResponsibleApprovalsPage() {
  const [tickets, setTickets] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api("/ticket/pending-responsible");
        setTickets(res.data || []);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  return (
    <AppLayout title="Pending approvals">
      <p className="muted">High-priority tickets from your department awaiting your confirmation.</p>
      {err ? <div className="error-banner">{err}</div> : null}
      <KanbanBoard
        tickets={tickets}
        linkPrefix="/responsible/ticket"
        columns={APPROVAL_COLUMNS}
        emptyMessage="No tickets awaiting approval."
      />
      <p style={{ marginTop: "1rem" }}>
        <Link to="/requester" className="muted">
          ← My tickets
        </Link>
      </p>
    </AppLayout>
  );
}
