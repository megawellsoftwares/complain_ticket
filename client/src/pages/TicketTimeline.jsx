import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { api, assetUrl } from "../api.js";
import { AppLayout } from "../components/AppLayout.jsx";
import { formatDate } from "../components/ticketUtils.jsx";
import { useTranslation } from "react-i18next";

export default function TicketTimeline() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t } = useTranslation();
  const [ticket, setTicket] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setErr("");
    try {
      const res = await api(`/ticket/${id}`);
      setTicket(res.data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <AppLayout title={t("Ticket Timeline")}>
        <p className="muted">{t("Loading timeline…")}</p>
      </AppLayout>
    );
  }

  if (err || !ticket) {
    return (
      <AppLayout title={t("Ticket Timeline")}>
        <div className="error-banner">{err || "Ticket not found"}</div>
        <button className="btn btn-ghost" onClick={() => nav(-1)}>
          ← {t("Back")}
        </button>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`${t("Timeline")}: ${ticket.subProblem?.problem?.name || t("Ticket")}`}>
      <div style={{ marginBottom: "1rem" }}>
        <button className="btn btn-ghost" onClick={() => nav(-1)} style={{ paddingLeft: 0 }}>
          ← {t("Back to ticket details")}
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: "auto", border: "1px solid var(--border)" }}>
        <table className="data" style={{ fontSize: "0.85rem", width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "0.75rem" }}>{t("Date & Time")}</th>
              <th style={{ padding: "0.75rem" }}>{t("Action")}</th>
              <th style={{ padding: "0.75rem" }}>{t("By")}</th>
              <th style={{ padding: "0.75rem" }}>{t("Status Change")}</th>
              <th style={{ padding: "0.75rem" }}>{t("Note")}</th>
              <th style={{ padding: "0.75rem" }}>{t("Vocal")}</th>
            </tr>
          </thead>
          <tbody>
            {(ticket.history || []).map((h, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "0.75rem" }}>{formatDate(h.createdAt)}</td>
                <td style={{ padding: "0.75rem", textTransform: "capitalize" }}>{t(h.action)}</td>
                <td style={{ padding: "0.75rem" }}>{h.user?.userName || "—"} <span className="muted">({h.user?.role})</span></td>
                <td style={{ padding: "0.75rem" }}>
                  {h.fromStatus ? <span className="muted">{t(h.fromStatus)} → </span> : null}
                  <strong>{t(h.toStatus || h.action)}</strong>
                </td>
                <td style={{ padding: "0.75rem" }}>
                  {h.note ? (
                    <div style={{ whiteSpace: "pre-wrap" }}>{h.note}</div>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td style={{ padding: "0.75rem" }}>
                  {h.voicePath ? (
                    <audio controls src={assetUrl(h.voicePath)} style={{ height: "30px", width: "150px" }} />
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
              </tr>
            ))}
            {(!ticket.history || ticket.history.length === 0) && (
              <tr>
                <td colSpan="6" className="muted" style={{ padding: "1rem", textAlign: "center" }}>{t("No history recorded.")}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
