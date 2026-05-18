import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, assetUrl } from "../../api.js";
import { AppLayout } from "../../components/AppLayout.jsx";
import { TicketDetailView } from "../../components/TicketDetailView.jsx";
import { AgentWorkPanel } from "../../components/AgentWorkPanel.jsx";

export default function AgentTicketPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [err, setErr] = useState("");

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

  const audioSrc = ticket?.voicePath ? assetUrl(ticket.voicePath) : "";

  return (
    <AppLayout title="Assignment">
      <p>
        <Link to="/agent" className="muted">
          ← Back to assignments
        </Link>
      </p>
      {err ? <div className="error-banner">{err}</div> : null}
      <TicketDetailView ticket={ticket} audioSrc={audioSrc}>
        <AgentWorkPanel ticket={ticket} ticketId={id} onUpdated={setTicket} />
      </TicketDetailView>
    </AppLayout>
  );
}
