import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api.js";
import { AppLayout } from "../../components/AppLayout.jsx";
import { KanbanBoard } from "../../components/KanbanBoard.jsx";
import { normalizeStatusForRequester } from "../../components/ticketUtils.jsx";

const AGENT_COLUMNS = ["dispatched", "seen-agent", "in-progress", "pending-confirmation", "fermer"];
const MY_TICKET_COLUMNS = ["pending-responsible", "received", "in-progress", "pending-confirmation", "fermer"];

export default function AgentHome() {
  const [assignedTickets, setAssignedTickets] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [activeTab, setActiveTab] = useState("assigned"); // 'assigned' or 'mine'
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [assignedRes, myRes] = await Promise.all([
          api("/ticket/assigned"),
          api("/ticket/my")
        ]);
        setAssignedTickets(assignedRes.data || []);
        setMyTickets(myRes.data || []);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AppLayout title="Agent Dashboard">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div className="tabs" style={{ display: "flex", gap: "1rem" }}>
          <button 
            className={`btn ${activeTab === "assigned" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setActiveTab("assigned")}
          >
            Assigned to Me ({assignedTickets.length})
          </button>
          <button 
            className={`btn ${activeTab === "mine" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setActiveTab("mine")}
          >
            My Personal Tickets ({myTickets.length})
          </button>
        </div>
        <Link to="/requester/new" className="btn btn-primary">
          + New Ticket
        </Link>
      </div>

      {err ? <div className="error-banner">{err}</div> : null}

      {loading ? (
        <p className="muted">Loading tickets...</p>
      ) : activeTab === "assigned" ? (
        <KanbanBoard 
          tickets={assignedTickets} 
          linkPrefix="/agent/ticket" 
          columns={AGENT_COLUMNS} 
          emptyMessage="No assignments right now." 
        />
      ) : (
        <KanbanBoard 
          tickets={myTickets} 
          linkPrefix="/requester/ticket" 
          columns={MY_TICKET_COLUMNS}
          normalizeFn={normalizeStatusForRequester}
          emptyMessage="You haven't created any tickets yet." 
        />
      )}
    </AppLayout>
  );
}

