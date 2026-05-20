import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, assetUrl } from "../../api.js";
import { AppLayout } from "../../components/AppLayout.jsx";
import { TicketDetailView } from "../../components/TicketDetailView.jsx";
import { VoiceRecorder } from "../../components/VoiceRecorder.jsx";

export default function ResponsibleTicketPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [problems, setProblems] = useState([]);
  const [subProblems, setSubProblems] = useState([]);
  const [problemId, setProblemId] = useState("");
  const [subProblemId, setSubProblemId] = useState("");
  const [notes, setNotes] = useState("");
  const [blob, setBlob] = useState(null);
  const [showModify, setShowModify] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setErr("");
    try {
      const res = await api(`/ticket/${id}`);
      setTicket(res.data);
      setNotes(res.data?.notes || "");
    } catch (e) {
      setErr(e.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

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
        const res = await api("/issue/all");
        setProblems(res.data || []);
      } catch {
        setProblems([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!problemId) {
      setSubProblems([]);
      return;
    }
    (async () => {
      try {
        const res = await api(`/issue/problem/${problemId}`);
        setSubProblems(res.data || []);
      } catch {
        setSubProblems([]);
      }
    })();
  }, [problemId]);

  const currentProblemId = useMemo(
    () => ticket?.subProblem?.problem?._id || ticket?.subProblem?.problem || "",
    [ticket],
  );

  useEffect(() => {
    if (currentProblemId && !problemId) {
      setProblemId(currentProblemId);
      setSubProblemId(ticket?.subProblem?._id || "");
    }
  }, [currentProblemId, problemId, ticket]);

  const canAct = ticket?.status === "pending-responsible";
  const audioSrc = ticket?.voicePath ? assetUrl(ticket.voicePath) : "";

  async function confirmTicket() {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      await api(`/ticket/responsible/${id}/confirm`, { method: "PATCH", body: {} });
      setMsg("Ticket confirmed.");
      nav("/responsible/approvals");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function cancelTicket() {
    if (!window.confirm("Cancel this ticket permanently?")) return;
    setBusy(true);
    setErr("");
    try {
      await api(`/ticket/responsible/${id}/cancel`, { method: "PATCH", body: {} });
      nav("/responsible/approvals");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function modifyTicket(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const fd = new FormData();
      if (subProblemId) fd.append("subProblemId", subProblemId);
      fd.append("notes", notes);
      if (blob) {
        const ext = blob.type.includes("webm") ? "webm" : blob.type.includes("mp4") ? "m4a" : "webm";
        fd.append("voice", blob, `description.${ext}`);
      }
      await api(`/ticket/responsible/${id}/modify`, { method: "PATCH", body: fd });
      setMsg("Ticket modified and sent to supervisor.");
      nav("/responsible/approvals");
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppLayout title="Review ticket">
      <p>
        <Link to="/responsible/approvals" className="muted">
          ← Pending approvals
        </Link>
      </p>
      {err ? <div className="error-banner">{err}</div> : null}
      {msg ? <div className="success-banner">{msg}</div> : null}

      <TicketDetailView ticket={ticket} audioSrc={audioSrc}>
        {canAct ? (
          <div className="stack" style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
            {!showModify ? (
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button type="button" className="btn btn-primary" onClick={confirmTicket} disabled={busy}>
                  Confirm
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModify(true)} disabled={busy}>
                  Modify
                </button>
                <button type="button" className="btn btn-ghost" onClick={cancelTicket} disabled={busy} style={{ color: "var(--danger)" }}>
                  Cancel ticket
                </button>
              </div>
            ) : (
              <form onSubmit={modifyTicket} className="stack">
                <h3 style={{ margin: 0 }}>Modify ticket</h3>
                <div className="field">
                  <label>Problem type</label>
                  <select value={problemId} onChange={(e) => setProblemId(e.target.value)}>
                    <option value="">Keep current…</option>
                    {problems.map((p) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                {problemId ? (
                  <div className="field">
                    <label>Sub-problem</label>
                    <select value={subProblemId} onChange={(e) => setSubProblemId(e.target.value)}>
                      <option value="">Keep current…</option>
                      {subProblems.map((s) => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                ) : null}
                <div className="field">
                  <label>Notes</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                </div>
                <div className="field">
                  <label>New voice recording (optional)</label>
                  <VoiceRecorder onRecordingComplete={(b) => setBlob(b)} />
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button type="submit" className="btn btn-primary" disabled={busy}>
                    Save & send to supervisor
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModify(false)}>
                    Back
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <p className="muted" style={{ margin: 0, borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
            This ticket is no longer awaiting approval.
          </p>
        )}
      </TicketDetailView>
    </AppLayout>
  );
}
