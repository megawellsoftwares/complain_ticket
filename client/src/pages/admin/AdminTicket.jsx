import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { api, assetUrl } from "../../api.js";
import { AppLayout } from "../../components/AppLayout.jsx";
import { TicketDetailView } from "../../components/TicketDetailView.jsx";

export default function AdminTicketPage() {
  const { id } = useParams();
  const loc = useLocation();
  const readOnly = loc.pathname.startsWith("/superadmin");
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
    // Mark notifications as read for this ticket
    api(`/notification/ticket/${id}/read`, { method: "PATCH", body: {} }).catch(() => {});
  }, [load, id]);

  useEffect(() => {
    if (readOnly) return;
    (async () => {
      try {
        const res = await api("/user/agents");
        setAgents(res.data || []);
      } catch {
        setAgents([]);
      }
    })();
  }, [readOnly]);

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
      setMsg("Ticket assigned.");
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  const audioSrc = ticket?.voicePath ? assetUrl(ticket.voicePath) : "";
  const canAssign =
    !readOnly && ticket && !ticket.assignedAgent && ["received", "seen"].includes(ticket.status);
  const backTo = readOnly ? "/superadmin/tickets" : "/admin/tickets";

  return (
    <AppLayout title={readOnly ? "Ticket (read-only)" : "Ticket (admin)"}>
      <p>
        <Link to={backTo} className="muted">
          ← All tickets
        </Link>
      </p>
      {err ? <div className="error-banner">{err}</div> : null}
      {msg ? <div className="success-banner">{msg}</div> : null}
      <TicketDetailView ticket={ticket} audioSrc={audioSrc}>
        {canAssign ? (
          <form onSubmit={assign} style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }} className="stack">
            <p style={{ margin: 0 }}>Assign to an agent (any department).</p>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="agent">Agent</label>
              <select id="agent" value={agentId} onChange={(e) => setAgentId(e.target.value)} required>
                <option value="">Choose agent…</option>
                {agents.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.userName} — {a.department?.name || "no dept"}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Assigning…" : "Assign ticket"}
            </button>
          </form>
        ) : !readOnly && ticket?.assignedAgent ? (
          <p className="muted" style={{ margin: 0, borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
            Assigned to {ticket.assignedAgent.userName || ticket.assignedAgent.email}.
          </p>
        ) : readOnly ? (
          <p className="muted" style={{ margin: 0, borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
            Read-only view.
          </p>
        ) : null}
      </TicketDetailView>
    </AppLayout>
  );
}
