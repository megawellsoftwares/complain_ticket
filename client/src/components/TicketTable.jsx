import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { StatusBadge, formatDate } from "./ticketUtils.jsx";

export function TicketTable({ tickets, linkPrefix }) {
  const { user } = useAuth();
  const { t } = useTranslation();

  if (!tickets?.length) {
    return <p className="muted">{t("No tickets yet.")}</p>;
  }

  return (
    <div className="card" style={{ padding: 0, overflow: "auto" }}>
      <table className="data">
        <thead>
          <tr>
            <th>{t("Problem")}</th>
            <th>{t("Status")}</th>
            <th>{t("Updated")}</th>
            {user?.role !== "requester" && <th>{t("Requester")}</th>}
            {user?.role === "supervisor" || user?.role === "admin" ? <th>{t("Serving dept")}</th> : null}
            <th />
          </tr>
        </thead>
        <tbody>
          {tickets.map((t_item) => (
            <tr key={t_item._id}>
              <td>
                {t_item.subProblem?.problem?.name || "—"}
                {t_item.isReopened ? <span className="reopen-tag"> · {t("Reopened")}</span> : null}
              </td>
              <td>
                <StatusBadge status={t_item.effectiveStatus || t_item.status} />
              </td>
              <td className="muted">{formatDate(t_item.updatedAt || t_item.createdAt)}</td>
              {user?.role !== "requester" && (
                <td>{t_item.requester?.userName || t_item.requester?.email || "—"}</td>
              )}
              {user?.role === "supervisor" || user?.role === "admin" ? (
                <td>{t_item.servingDepartment?.name || "—"}</td>
              ) : null}
              <td>
                <Link to={`${linkPrefix}/${t_item._id}`} className="btn btn-ghost" style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem" }}>
                  {t("Open")}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

