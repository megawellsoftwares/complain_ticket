import { useState } from "react";
import { api } from "../api.js";
import { VoiceRecorder } from "./VoiceRecorder.jsx";
import { TicketHistoryPanel } from "./TicketHistoryPanel.jsx";
import { useTranslation } from "react-i18next";

export function AgentWorkPanel({ ticket, ticketId, onUpdated }) {
  const { t } = useTranslation();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const [showEscalate, setShowEscalate] = useState(false);
  const [escalateNotes, setEscalateNotes] = useState("");
  const [escalateVoice, setEscalateVoice] = useState(null);

  const status = ticket?.status;
  const canStart = ["dispatched", "seen-agent", "assigned"].includes(status);
  const isInProgress = status === "in-progress";
  const isAwaitingConfirm = ["pending-confirmation", "resolved", "solved"].includes(status);

  async function startWork() {
    setBusy("start");
    setErr("");
    try {
      const res = await api("/ticket/accept", { method: "POST", body: { ticketId } });
      onUpdated(res.data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }

  async function markSolved() {
    setBusy("resolve");
    setErr("");
    try {
      const res = await api("/ticket/status", {
        method: "PATCH",
        body: { ticketId, status: "pending-confirmation" },
      });
      onUpdated(res.data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }

  async function submitCannotSolve(e) {
    if (e) e.preventDefault();
    setBusy("escalate");
    setErr("");
    try {
      const fd = new FormData();
      fd.append("ticketId", ticketId);
      if (escalateNotes) fd.append("notes", escalateNotes);
      if (escalateVoice) fd.append("voice", escalateVoice);
      const res = await api("/ticket/agent-cannot-solve", { method: "POST", body: fd });
      onUpdated(res.data);
      setShowEscalate(false);
      setEscalateNotes("");
      setEscalateVoice(null);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  }

  if (!ticket) return null;

  return (
    <>
      {err ? <div className="error-banner">{err}</div> : null}
      {canStart ? (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }} className="stack">
          <p className="muted" style={{ marginTop: 0 }}>
            {t("This ticket was dispatched to you. Review the details, then start work when ready.")}
          </p>
          <button type="button" className="btn btn-primary" disabled={!!busy} onClick={startWork}>
            {busy === "start" ? t("Starting…") : t("Start work")}
          </button>
        </div>
      ) : isInProgress ? (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }} className="stack">
          <p className="muted" style={{ marginTop: 0 }}>
            {t("After you contact the requester and fix the issue, mark it solved so they can confirm.")}
          </p>
          {showEscalate ? (
            <div className="card stack" style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)" }}>
              <h4>{t("Escalate to Supervisor")}</h4>
              <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                {t("Explain why you cannot solve this ticket. You can write a note or leave a voice message.")}
              </p>
              <div className="field">
                <label>{t("Notes")}</label>
                <textarea rows="3" value={escalateNotes} onChange={(e) => setEscalateNotes(e.target.value)} placeholder={t("Write your explanation here...")} />
              </div>
              <div className="field">
                <label>{t("Voice recording")}</label>
                <VoiceRecorder onRecordingComplete={(blob) => setEscalateVoice(blob)} />
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button type="button" className="btn btn-danger" onClick={submitCannotSolve} disabled={!!busy}>
                  {busy === "escalate" ? t("Sending…") : t("Confirm Escalate")}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowEscalate(false)} disabled={!!busy}>
                  {t("Cancel")}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              <button type="button" className="btn btn-primary" disabled={!!busy} onClick={markSolved}>
                {busy === "resolve" ? t("Saving…") : t("Mark solved (await requester)")}
              </button>
              <button type="button" className="btn btn-danger" disabled={!!busy} onClick={() => setShowEscalate(true)}>
                {t("I can't solve it — return to supervisor")}
              </button>
            </div>
          )}
        </div>
      ) : isAwaitingConfirm ? (
        <p className="muted" style={{ margin: 0, borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
          {t("Waiting for the requester to confirm closure.")}
        </p>
      ) : null}

      <TicketHistoryPanel history={ticket.history} />
    </>
  );
}
