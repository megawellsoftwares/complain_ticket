import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, assetUrl } from "../../api.js";
import { AppLayout } from "../../components/AppLayout.jsx";
import { TicketDetailView } from "../../components/TicketDetailView.jsx";
import { AgentWorkPanel } from "../../components/AgentWorkPanel.jsx";
import { useAuth } from "../../auth/AuthContext.jsx";

export default function SupervisorTicketPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [agents, setAgents] = useState([]);
  const [agentId, setAgentId] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setErr("");
    try {
      const res = await api(`/ticket/${id}`);
      setTicket(res.data);
    } catch (e) {
      setErr(e.message);
    }
  }, [id]);

  useEffect(() => {
    load();
    api(`/notification/ticket/${id}/read`, { method: "PATCH", body: {} }).catch(() => {});
  }, [load, id]);

  useEffect(() => {
    let mounted = true;
    import("../../socket.js").then(({ default: socket, connectSocket }) => {
      connectSocket();
      socket.on("ticket:updated", (t) => {
        if (!mounted) return;
        if (t._id === id) setTicket(t);
      });
    });
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api("/user/agents");
        setAgents(res.data || []);
      } catch {
        setAgents([]);
      }
    })();
  }, []);

  async function assign(e) {
    e.preventDefault();
    if (!agentId) return;
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const res = await api("/ticket/assign", {
        method: "PATCH",
        body: { ticketId: id, agentId },
      });
      setTicket(res.data);
      setMsg("Ticket dispatched to agent.");
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  async function startDirectly() {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const res = await api("/ticket/supervisor-start", {
        method: "POST",
        body: { ticketId: id },
      });
      setTicket(res.data);
      setMsg("You are assigned — continue as the agent on this ticket.");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  const audioSrc = ticket?.voicePath ? assetUrl(ticket.voicePath) : "";
  const status = ticket?.status;
  const canAssign = ticket && ["received", "seen-admin", "seen-supervisor"].includes(status);
  const isDispatched = ticket && ["dispatched", "seen-agent", "assigned"].includes(status);
  const assignedId = ticket?.assignedAgent?._id || ticket?.assignedAgent;
  const isSelfAssigned = assignedId && user?._id && assignedId.toString() === user._id.toString();

  return (
    <AppLayout title="Supervisor ticket">
      <p>
        <Link to="/supervisor" className="muted">
          ← Inbox
        </Link>{" "}
        ·{" "}
        <Link to="/supervisor/tracking" className="muted">
          Tracking
        </Link>
      </p>
      {err ? <div className="error-banner">{err}</div> : null}
      {msg ? <div className="success-banner">{msg}</div> : null}
      <TicketDetailView ticket={ticket} audioSrc={audioSrc}>
        <div className="stack" style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
          {ticket?.assignedAgent && (
            <p className="muted" style={{ margin: 0 }}>
              Assigned to {ticket.assignedAgent.userName || ticket.assignedAgent.email}. Status updates as the agent works the ticket.
            </p>
          )}

          {canAssign && (
            <form onSubmit={assign} className="stack">
              <p style={{ margin: 0 }}>{ticket?.assignedAgent ? "Reassign to another agent:" : "Assign to an agent in your department:"}</p>
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="agent">Agent</label>
                <select id="agent" value={agentId || (ticket.assignedAgent?._id || "")} onChange={(e) => setAgentId(e.target.value)} required>
                  <option value="">Choose agent…</option>
                  {agents.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.userName} ({a.email})
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", width: "100%", marginTop: "0.5rem" }}>
                <button type="submit" className="btn btn-primary" disabled={busy} style={{ flex: 1 }}>
                  {busy ? "Assigning…" : ticket?.assignedAgent ? "Reassign ticket" : "Dispatch to agent"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={startDirectly} disabled={busy} style={{ flex: 1 }}>
                  Start (solve directly)
                </button>
              </div>
            </form>
          )}

          {isDispatched && !canAssign && !isSelfAssigned && (
            <p className="muted" style={{ margin: 0 }}>
              This ticket has been dispatched. Track progress on the{" "}
              <Link to="/supervisor/tracking">tracking board</Link>.
            </p>
          )}

          {isSelfAssigned && !canAssign ? (
            <AgentWorkPanel ticket={ticket} ticketId={id} onUpdated={setTicket} />
          ) : null}
        </div>
      </TicketDetailView>
    </AppLayout>
  );
}
