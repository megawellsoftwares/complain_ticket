import { useMemo } from "react";
import { Link } from "react-router-dom";
import { StatusBadge, TicketBadges, formatDate, normalizeStatus } from "./ticketUtils.jsx";

import { useTranslation } from "react-i18next";
const DEFAULT_COLUMNS = [
  "received", 
  "seen-supervisor", 
  "dispatched", 
  "in-progress", 
  "pending-confirmation", 
  "fermer"
];
function ticketDisplayStatus(t, normalizeFn = normalizeStatus) {
  return normalizeFn(t?.effectiveStatus ?? t?.status ?? "");
}

export function KanbanBoard({
  tickets,
  linkPrefix,
  columns = DEFAULT_COLUMNS,
  emptyMessage = "No tickets.",
  normalizeFn = normalizeStatus,
}) {
  const { t } = useTranslation();
  const groups = useMemo(() => {
    const m = Object.fromEntries(columns.map((c) => [c, []]));
    for (const t_obj of tickets || []) {
      const s = ticketDisplayStatus(t_obj, normalizeFn);
      if (t_obj.ticketId === "YOUR_PROBLEM_TICKET_ID") {
    console.log("Raw ticket status:", t_obj.status, t_obj.effectiveStatus);
    console.log("Normalized status output:", s);
    console.log("Does columns include it?", columns.includes(s));
  }
      if (m[s]) m[s].push(t_obj);
      else if (!columns.includes(s)) {
        const fallback = columns[0];
        if (m[fallback]) m[fallback].push(t_obj);
      }
    }
    return m;
  }, [tickets, columns, normalizeFn]);

  const total = (tickets || []).length;

  return (
    <>
      {!total ? <p className="muted">{t(emptyMessage)}</p> : null}
      <div className="kanban">
        {columns.map((col) => (
          <section key={col} className="kanban-col">
            <header className="kanban-col-head">
              <span className="kanban-title">{t(`status.${col}`, col)}</span>
              <span className="kanban-count">{groups[col]?.length || 0}</span>
            </header>
            <div className="kanban-cards">
              {(groups[col] || []).map((t_item) => (
                <Link key={t_item._id} to={`${linkPrefix}/${t_item._id}`} className="kanban-card">
                  <div className="kanban-card-top">
                    <div>
                      {t_item.ticketId ? (
                        <span className="kanban-ticket-id">{t_item.ticketId}</span>
                      ) : null}
                      <strong className="kanban-card-title">{t_item.subProblem?.problem?.name || t("Ticket")}</strong>
                    </div>
                    <StatusBadge status={ticketDisplayStatus(t_item, normalizeFn)} />
                  </div>
               
                  <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.72rem" }}>
                    {t_item.requester?.department?.name || "—"}
                  </p>
                  {t_item.needsSupervisorReassign ? (
                    <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.75rem" }}>
                      {t("Awaiting supervisor reassignment")}
                    </p>
                  ) : null}
                  <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.72rem" }}>
                    {formatDate(t_item.updatedAt || t_item.createdAt)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
