import { formatDate } from "./ticketUtils.jsx";
import { assetUrl } from "../api.js";
import { useTranslation } from "react-i18next";

export function TicketHistoryPanel({ history }) {
  const { t } = useTranslation();
  if (!history?.length) return null;

  return (
    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginTop: "0.5rem" }}>
      <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem" }}>{t("Ticket history")}</h3>
      <div className="stack" style={{ gap: "0.65rem" }}>
        {history.map((h) => (
          <div key={h._id} className="card" style={{ padding: "0.65rem 0.75rem", background: "var(--bg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
              <strong style={{ fontSize: "0.85rem", textTransform: "capitalize" }}>{h.action?.replace(/-/g, " ")}</strong>
              <span className="muted" style={{ fontSize: "0.75rem" }}>{formatDate(h.createdAt)}</span>
            </div>
            <p className="muted" style={{ margin: "0.25rem 0 0", fontSize: "0.8rem" }}>
              {h.user?.userName || "—"}
              {h.fromStatus && h.toStatus ? ` · ${h.fromStatus} → ${h.toStatus}` : ""}
            </p>
            {h.note ? <p style={{ margin: "0.35rem 0 0", fontSize: "0.85rem" }}>{h.note}</p> : null}
            {h.voicePath ? (
              <audio className="audio-player" controls src={assetUrl(h.voicePath)} style={{ marginTop: "0.35rem", width: "100%" }} />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
