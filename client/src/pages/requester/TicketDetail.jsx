import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, assetUrl } from "../../api.js";
import { AppLayout } from "../../components/AppLayout.jsx";
import { TicketDetailView } from "../../components/TicketDetailView.jsx";
import { VoiceRecorder } from "../../components/VoiceRecorder.jsx";
import { useTranslation } from "react-i18next";

export default function RequesterTicketPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t } = useTranslation();
  const [ticket, setTicket] = useState(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [showSameProblem, setShowSameProblem] = useState(false);
  const [notes, setNotes] = useState("");
  const [voiceBlob, setVoiceBlob] = useState(null);

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

  const awaiting = ["pending-confirmation", "resolved", "solved"].includes(ticket?.status);

  async function respond({ confirmed, sameProblem }) {
    setBusy(true);
    setMsg("");
    setErr("");
    try {
      let res;
      if (sameProblem) {
        const fd = new FormData();
        fd.append("ticketId", id);
        fd.append("confirmed", "false");
        fd.append("sameProblem", "true");
        if (notes) fd.append("notes", notes);
        if (voiceBlob) {
          const ext = voiceBlob.type.includes("webm") ? "webm" : "m4a";
          fd.append("voice", voiceBlob, `followup.${ext}`);
        }
        res = await api("/ticket/respond-resolution", { method: "POST", body: fd });
        setTicket(res.data);
        setMsg(t("Ticket sent back to the agent with your note."));
        setShowSameProblem(false);
      } else if (confirmed) {
        res = await api("/ticket/respond-resolution", {
          method: "POST",
          body: { ticketId: id, confirmed: true },
        });
        setTicket(res.data);
        setMsg(t("Ticket closed. Thank you."));
      } else {
        res = await api("/ticket/respond-resolution", {
          method: "POST",
          body: { ticketId: id, confirmed: false, sameProblem: false },
        });
        if (res.redirectToNewTicket) {
          nav("/requester/new");
          return;
        }
        setMsg(res.message);
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  const audioSrc = ticket?.voicePath ? assetUrl(ticket.voicePath) : "";

  return (
    <AppLayout title="Ticket">
      <p>
        <Link to="/requester" className="muted">
          ← Back to my tickets
        </Link>
      </p>
      {err ? <div className="error-banner">{err}</div> : null}
      {msg ? <div className="success-banner">{msg}</div> : null}
      <TicketDetailView ticket={ticket} audioSrc={audioSrc}>
        {awaiting ? (
          <div className="stack" style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
            <p style={{ margin: 0 }}>{t("The agent marked this as solved. Is your issue fixed?")}</p>
            {!showSameProblem ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                <button type="button" className="btn btn-primary" disabled={busy} onClick={() => respond({ confirmed: true })}>
                  {t("Yes, solved")}
                </button>
                <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setShowSameProblem(true)}>
                  {t("No — same problem")}
                </button>
                <button type="button" className="btn btn-danger" disabled={busy} onClick={() => respond({ confirmed: false, sameProblem: false })}>
                  {t("No — different problem")}
                </button>
              </div>
            ) : (
              <div className="card stack">
                <h4 style={{ margin: 0 }}>{t("Describe what's still wrong")}</h4>
                <div className="field">
                  <label>{t("Written notes")}</label>
                  <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("Explain what is still not working…")} />
                </div>
                <div className="field">
                  <label>{t("Voice note")}</label>
                  <VoiceRecorder onRecordingComplete={setVoiceBlob} />
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button type="button" className="btn btn-primary" disabled={busy} onClick={() => respond({ sameProblem: true })}>
                    {t("Send back to agent")}
                  </button>
                  <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setShowSameProblem(false)}>
                    {t("Cancel")}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </TicketDetailView>
    </AppLayout>
  );
}
