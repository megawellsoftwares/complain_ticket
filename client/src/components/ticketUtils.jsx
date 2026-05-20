export function statusBadgeClass(status) {
  const map = {
    received: "badge-received",
    "seen-admin": "badge-seen",
    "seen-supervisor": "badge-seen",
    assigned: "badge-assigned",
    dispatched: "badge-assigned",
    "seen-agent": "badge-assigned",
    "in-progress": "badge-in-progress",
    resolved: "badge-resolved",
    solved: "badge-resolved",
    "pending-confirmation": "badge-resolved",
    "pending-responsible": "badge-assigned",
    closed: "badge-closed",
    fermer: "badge-closed",
  };
  return map[status] || "badge-closed";
}

/** Map legacy statuses to the new workflow for Kanban grouping */
export function normalizeStatus(status) {
  const map = {
    "seen-admin": "seen-admin",
    assigned: "dispatched",
    resolved: "pending-confirmation",
    solved: "pending-confirmation",
    closed: "fermer",
  };
  return map[status] || status;
}

/** Simpler columns for requester-facing boards */
export function normalizeStatusForRequester(status) {
  const map = {
    "seen-admin": "seen",
    "seen-supervisor": "seen",
    assigned: "seen",
    dispatched: "seen",
    "seen-agent": "seen",
    resolved: "pending-confirmation",
    solved: "pending-confirmation",
    closed: "fermer",
  };
  return map[status] || status;
}

import { useTranslation } from "react-i18next";

export function StatusBadge({ status }) {
  const { t } = useTranslation();
  return <span className={`badge ${statusBadgeClass(status)}`}>{t(`status.${status}`, status)}</span>;
}

export function TicketBadges({ ticket }) {
  const { t } = useTranslation();
  if (!ticket) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.35rem" }}>
      {ticket.priority === "high" ? <span className="badge badge-priority-high">{t("High")}</span> : null}
      {ticket.isUpdated ? <span className="badge badge-updated">{t("Updated")}</span> : null}
      {ticket.isCanceled ? <span className="badge badge-canceled">{t("Canceled")}</span> : null}
      {ticket.isReopened ? <span className="badge badge-reopened">{t("Reopened")}</span> : null}
    </div>
  );
}


export function formatDate(iso) {
  if (!iso) return "—";
  try {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffDays > 0) {
      return `${diffDays}d ${diffHrs % 24}h ${diffMin % 60}m ago`;
    }
    if (diffHrs > 0) {
      return `${diffHrs}h ${diffMin % 60}m ago`;
    }
    if (diffMin > 0) {
      return `${diffMin}m ago`;
    }
    return "just now";
  } catch {
    return String(iso);
  }
}
