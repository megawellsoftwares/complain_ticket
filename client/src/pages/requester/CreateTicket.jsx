import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api.js";
import { AppLayout } from "../../components/AppLayout.jsx";
import { VoiceRecorder } from "../../components/VoiceRecorder.jsx";

import { useTranslation } from "react-i18next";

export default function CreateTicketPage() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [problems, setProblems] = useState([]);
  const [subProblems, setSubProblems] = useState([]);
  const [problemId, setProblemId] = useState("");
  const [subProblemId, setSubProblemId] = useState("");
  const [err, setErr] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [blob, setBlob] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api("/issue/all");
        setProblems(res.data || []);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  useEffect(() => {
    if (!problemId) {
      setSubProblems([]);
      setSubProblemId("");
      return;
    }
    (async () => {
      try {
        const res = await api(`/issue/problem/${problemId}`);
        setSubProblems(res.data || []);
        setSubProblemId("");
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, [problemId]);

  const selectedProblem = useMemo(() => problems.find((p) => p._id === problemId), [problems, problemId]);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!blob) {
      setErr(t("Please record a voice description."));
      return;
    }
    if (!problemId || !subProblemId) {
      setErr(t("Select a problem and sub-problem."));
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("problemId", problemId);
      fd.append("subProblemId", subProblemId);
      fd.append("notes", notes);
      const ext = blob.type.includes("webm") ? "webm" : blob.type.includes("mp4") ? "m4a" : "webm";
      fd.append("voice", blob, `description.${ext}`);
      await api("/ticket", { method: "POST", body: fd });
      nav("/requester");
    } catch (e2) {
      setErr(e2.message || t("Could not create ticket"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppLayout title={t("New ticket")}>
      <p className="muted">
        {t("Choose the category, then record a short voice note describing the issue.")}
      </p>

      {err ? <div className="error-banner">{err}</div> : null}
      <form className="card stack" onSubmit={submit}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>{t("Problem type")}</label>
          <select value={problemId} onChange={(e) => setProblemId(e.target.value)} required>
            <option value="">{t("Select problem…")}</option>
            {problems.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
                {p.department?.name ? ` (${p.department.name})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label>{t("Sub-problem")}</label>
          <select value={subProblemId} onChange={(e) => setSubProblemId(e.target.value)} required disabled={!problemId}>
            <option value="">{t("Select sub-problem…")}</option>
            {subProblems.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>{t("Voice description")}</label>
          <VoiceRecorder onRecordingComplete={(b) => setBlob(b)} />
        </div>
        <div className="field">
          <label>{t("Written notes")}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("Additional details (optional)")}
            style={{ minHeight: "80px", width: "100%", borderRadius: "8px", border: "1px solid var(--border)", padding: "0.5rem" }}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? t("Submitting…") : t("Submit ticket")}
        </button>

      </form>
    </AppLayout>
  );
}
