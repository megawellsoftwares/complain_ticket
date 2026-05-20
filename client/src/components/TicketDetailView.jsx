import { StatusBadge, TicketBadges, formatDate } from "./ticketUtils.jsx";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { assetUrl } from "../api.js";
import { useAuth } from "../auth/AuthContext.jsx";

export function TicketDetailView({ ticket, audioSrc, children }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  if (!ticket) return null;

  const displayStatus = ticket.effectiveStatus ?? ticket.status;

  return (
    <div className="card stack">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          {ticket.ticketId ? (
            <p className="muted" style={{ margin: "0 0 0.25rem", fontSize: "0.85rem", fontWeight: 600 }}>
              {ticket.ticketId}
            </p>
          ) : null}
          <h2 style={{ margin: "0 0 0.25rem", fontSize: "1.15rem" }}>{ticket.subProblem?.problem?.name || t("Tickets")}</h2>
          <p className="muted" style={{ margin: 0 }}>
            {ticket.subProblem?.name || "—"} <br />
           
          </p>
       
        </div>
        <div  style={{ display: "flex"  ,gap: "0.5rem", flexWrap: "wrap" }}> 
        <TicketBadges ticket={ticket} />
        <StatusBadge status={displayStatus} />
        </div>
      </div>
      <div className="grid2">
        <div>
          <p className="muted" style={{ margin: "0 0 0.25rem", fontSize: "0.8rem" }}>
            {t("Requester")}
          </p>
          <p style={{ margin: 0 }}>{ticket.requester?.userName || ticket.requester?.email || "—"}</p>
          <p className="muted" style={{ margin: "0.25rem 0 0", fontSize: "0.85rem" }}>
            {t("Phone")}:{" "}
            {ticket.requester?.phone ? (
              <a 
                href={`https://api.whatsapp.com/send?phone=${ticket.requester.phone.replace(/\D/g, "").replace(/^0/, "213")}`} 
                target="_blank" 
                rel="noreferrer" 
                style={{ color: "var(--accent)", textDecoration: "underline" }}
              >
                {ticket.requester.phone}
              </a>
            ) : "—"}
          </p>
        </div>
        <div>
          <p className="muted" style={{ margin: "0 0 0.25rem", fontSize: "0.8rem" }}>
            {t("Departments")}
          </p>
          <p style={{ margin: 0 }}>
            {t("From")}: {ticket.requester?.department?.name || "—"} → {t("Serving")}: {ticket.servingDepartment?.name || "—"}
          </p>
        </div>
        <div>
          <p className="muted" style={{ margin: "0 0 0.25rem", fontSize: "0.8rem" }}>
            {t("Assigned agent")}
          </p>
          <p style={{ margin: 0 }}>{ticket.assignedAgent?.userName || ticket.assignedAgent?.email || "—"}</p>
        </div>
        <div>
          <p className="muted" style={{ margin: "0 0 0.25rem", fontSize: "0.8rem" }}>
            {t("Supervisor")}
          </p>
          <p style={{ margin: 0 }}>{ticket.supervisor?.userName || ticket.supervisor?.email || "—"}</p>
        </div>
        <div>
          <p className="muted" style={{ margin: "0 0 0.25rem", fontSize: "0.8rem" }}>
            {t("Created")}
          </p>
          <p style={{ margin: 0 }}>{formatDate(ticket.createdAt)}</p>
        </div>
        <div>
          <p className="muted" style={{ margin: "0 0 0.25rem", fontSize: "0.8rem" }}>
            {t("Last update")}
          </p>
          <p style={{ margin: 0 }}>{formatDate(ticket.updatedAt)}</p>
        </div>
      </div>
      <div>
        <p className="muted" style={{ margin: "0 0 0.35rem", fontSize: "0.8rem" }}>
          {t("Voice description")}
        </p>
        {audioSrc ? <audio className="audio-player" controls src={audioSrc} /> : <p className="muted">{t("No audio")}</p>}
      </div>
      {ticket.notes && (
        <div style={{ marginTop: "1rem" }}>
          <p className="muted" style={{ margin: "0 0 0.35rem", fontSize: "0.8rem" }}>
            {t("Written notes")}
          </p>
          <div className="card" style={{ background: "var(--bg)", border: "1px solid var(--border)", whiteSpace: "pre-wrap", padding: "0.75rem" }}>
            {ticket.notes}
          </div>
        </div>
      )}
      {["supervisor", "admin", "superadmin"].includes(user?.role) && (
        <div style={{ marginTop: "1.5rem" }}>
          <Link to={`/timeline/${ticket._id}`} className="btn btn-ghost" style={{ border: "1px solid var(--border)", width: "100%", justifyContent: "center" }}>
            📅 {t("View Full Ticket Timeline")}
          </Link>
        </div>
      )}
      {children}
    </div>
  );
}

