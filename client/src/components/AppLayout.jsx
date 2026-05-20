import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { NotificationBell } from "./NotificationBell.jsx";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";

export function AppLayout({ title, children }) {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  
  // Theme state
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  const toggleLang = () => {
    const nextLang = i18n.language === "en" ? "fr" : "en";
    i18n.changeLanguage(nextLang);
  };

  const navByRole = {
    superadmin: [
      { to: "/superadmin/tickets", label: t("Tickets") },
      { to: "/superadmin/users", label: t("Users") },
      { to: "/superadmin/statistics", label: t("Statistics") },
    ],
    admin: [
      { to: "/admin/users", label: t("Users") },
      { to: "/admin/departments", label: t("Departments") },
      { to: "/admin/problems", label: t("Problems") },
      { to: "/admin/tickets", label: t("All tickets") },
      { to: "/admin/statistics", label: t("Statistics") },
    ],
    supervisor: [
      
      { to: "/supervisor/tracking", label: t("Tracking") },
      { to: "/supervisor/agents", label: t("Agents") },
      { to: "/requester", label: t("My requests") },
      { to: "/requester/new", label: t("New ticket") },
    ],
    agent: [
      { to: "/agent", label: t("My assignments") },
      { to: "/requester", label: t("My requests") },
      { to: "/requester/new", label: t("New ticket") },
    ],
    requester: [
      { to: "/requester", label: t("My tickets") },
      { to: "/requester/new", label: t("New ticket") },
    ],
    responsible: [
      { to: "/requester", label: t("My tickets") },
      { to: "/responsible/approvals", label: t("Approvals") },
      { to: "/requester/new", label: t("New ticket") },
      { to: "/responsible/team", label: t("Dept. requesters") },
    ],
  };

  const links = navByRole[user?.role] || [];

  return (
    <div className="layout">
      <header className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <img src="/logo.png" alt="ashki logo" style={{ height: "40px", width: "auto" }} />
          <div>
            <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "var(--accent)", fontWeight: 800 }}>ashki</span>
              <span style={{ opacity: 0.5, fontWeight: 300 }}>|</span>
              {title}
            </h1>
            <p className="muted" style={{ margin: "0.15rem 0 0", fontSize: "0.85rem" }}>
              {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName} (${user.userName})` : user?.userName} · <span style={{ textTransform: "capitalize" }}>{user?.role}</span>
            </p>
          </div>
        </div>
        <nav className="nav-links">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => (isActive ? "active" : "")}
              end={
                l.to === "/admin" ||
                l.to === "/supervisor" ||
                l.to === "/agent" ||
                l.to === "/requester" ||
                l.to === "/superadmin"
              }
            >
              {l.label}
            </NavLink>
          ))}
          <NavLink to="/profile" className={({ isActive }) => (isActive ? "active" : "")}>
            {t("Profile")}
          </NavLink>
          <NotificationBell />
          
          <button type="button" className="btn btn-ghost" onClick={toggleTheme} title="Toggle Theme">
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          
          <button type="button" className="btn btn-ghost" onClick={toggleLang} title="Change Language">
            {i18n.language === "en" ? "FR" : "EN"}
          </button>

          <button type="button" className="btn btn-ghost" onClick={logout}>
            {t("Log out")}
          </button>
        </nav>
      </header>
      {children}
    </div>
  );
}

