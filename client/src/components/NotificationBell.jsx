import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth/AuthContext.jsx";

import { useTranslation } from "react-i18next";

export function NotificationBell() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    if (!user || user.role === "superadmin") return;
    try {
      const res = await api("/notification");
      setItems(res.data || []);
      setErr("");
    } catch (e) {
      if (e.status !== 403) setErr(e.message);
    }
  }, [user]);

  useEffect(() => {
    load();
    const t_int = setInterval(load, 25000);
    return () => clearInterval(t_int);
  }, [load]);

  const unread = (items || []).filter((n) => !n.read).length;

  async function markRead(id) {
    try {
      await api(`/notification/${id}/read`, { method: "PATCH", body: {} });
      await load();
    } catch {
      /* ignore */
    }
  }

  async function markAll() {
    try {
      await api("/notification/read-all", { method: "PATCH", body: {} });
      await load();
    } catch {
      /* ignore */
    }
  }

  if (!user || user.role === "superadmin") return null;

  return (
    <div className="notif-wrap">
      <button type="button" className="btn btn-ghost notif-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {t("Notifications")}
        {unread > 0 ? <span className="notif-badge">{unread > 99 ? "99+" : unread}</span> : null}
      </button>
      {open ? (
        <div className="notif-panel card">
          <div className="notif-panel-head">
            <span>{t("Alerts")}</span>
            {unread ? (
              <button type="button" className="btn btn-ghost" style={{ padding: "0.2rem 0.5rem", fontSize: "0.8rem" }} onClick={markAll}>
                {t("Mark all read")}
              </button>
            ) : null}
          </div>
          {err ? <p className="muted" style={{ margin: "0.5rem" }}>{err}</p> : null}
          <ul className="notif-list">
            {!items.length ? (
              <li className="muted" style={{ padding: "0.75rem" }}>
                {t("No notifications yet.")}
              </li>
            ) : (
              items.map((n) => (
                <li key={n._id} className={n.read ? "notif-item read" : "notif-item"}>
                  <button
                    type="button"
                    className="notif-item-btn"
                    onClick={() => {
                      if (!n.read) markRead(n._id);
                      if (n.ticket) navigate(roleTicketPath(user.role, n.ticket));
                    }}
                  >
                    <strong>{n.title}</strong>
                    {n.body ? <span className="muted">{n.body}</span> : null}
                    <span className="muted" style={{ fontSize: "0.72rem" }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}


function roleTicketPath(role, ticketId) {
  if (role === "admin") return `/admin/ticket/${ticketId}`;
  if (role === "supervisor") return `/supervisor/ticket/${ticketId}`;
  if (role === "agent") return `/agent/ticket/${ticketId}`;
  return `/requester/ticket/${ticketId}`;
}
