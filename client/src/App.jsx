import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import LoginPage from "./pages/Login.jsx";
import RequesterHome from "./pages/requester/RequesterHome.jsx";
import CreateTicket from "./pages/requester/CreateTicket.jsx";
import RequesterTicket from "./pages/requester/TicketDetail.jsx";
import AgentHome from "./pages/agent/AgentHome.jsx";
import AgentTicket from "./pages/agent/TicketDetail.jsx";
import SupervisorHome from "./pages/supervisor/SupervisorHome.jsx";
import SupervisorTracking from "./pages/supervisor/Tracking.jsx";
import SupervisorTicket from "./pages/supervisor/TicketDetail.jsx";
import SupervisorAgents from "./pages/supervisor/AgentsList.jsx";
import SupervisorAgentProfile from "./pages/supervisor/AgentProfile.jsx";
import AdminHome from "./pages/admin/AdminHome.jsx";
import AdminUsers from "./pages/admin/ManageUsers.jsx";
import AdminDepartments from "./pages/admin/ManageDepartments.jsx";
import AdminProblems from "./pages/admin/ManageProblems.jsx";
import AdminTickets from "./pages/admin/AdminTickets.jsx";
import AdminTicket from "./pages/admin/AdminTicket.jsx";
import ResponsibleTeam from "./pages/responsible/ResponsibleTeam.jsx";
import ResponsibleApprovals from "./pages/responsible/ResponsibleApprovals.jsx";
import ResponsibleTicket from "./pages/responsible/TicketDetail.jsx";
import SuperadminHome from "./pages/superadmin/SuperadminHome.jsx";
import StatisticsPage from "./pages/admin/Statistics.jsx";
import TicketTimeline from "./pages/TicketTimeline.jsx";
import ProfilePage from "./pages/Profile.jsx";
import { Link } from "react-router-dom";
import { roleHome } from "./utils/roleHome.js";

import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";

function HomePage() {
  const { user, loading } = useAuth();
  const { t, i18n } = useTranslation();

  // Theme logic for landing page
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === "dark" ? "light" : "dark"));
  const toggleLang = () => {
    const nextLang = i18n.language === "en" ? "fr" : "en";
    i18n.changeLanguage(nextLang);
  };

  if (loading) {
    return (
      <div className="layout">
        <p className="muted">{t("Loading…")}</p>
      </div>
    );
  }
  if (user) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  return (
    <div className="layout" style={{ maxWidth: 900, paddingTop: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", marginBottom: "1rem" }}>
        <button type="button" className="btn btn-ghost" onClick={toggleTheme} title={t("Toggle Theme")}>
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={toggleLang} title={t("Change Language")}>
          {i18n.language === "en" ? "FR" : "EN"}
        </button>
      </div>

      <div className="hero">
        <img src="/logo.png" alt="ashki logo" style={{ height: "120px", marginBottom: "2rem" }} />
        <h1 style={{ fontSize: "4rem", color: "var(--accent)", fontWeight: 800, margin: "0 0 0.5rem" }}>ashki</h1>
        <div className="badge" style={{ background: "rgba(35, 186, 166, 0.1)", color: "var(--accent)", marginBottom: "1.5rem", padding: "0.4rem 1rem" }}>
          {t("Smart Ticketing Solution")}
        </div>
        <p className="muted" style={{ fontSize: "1.2rem", maxWidth: "600px", margin: "0 auto 2rem" }}>
          {t("Your premium bridge to quality service and efficient complaint management.")}
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <Link to="/login" className="btn btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "1rem" }}>
            {t("Get Started")}
          </Link>
        </div>
      </div>

      <div className="grid2" style={{ marginTop: "2rem" }}>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎙️</div>
          <h3>{t("Voice Descriptions")}</h3>
          <p className="muted" style={{ fontSize: "0.9rem" }}>{t("Record your feedback directly for maximum clarity and speed.")}</p>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📊</div>
          <h3>{t("Live Tracking")}</h3>
          <p className="muted" style={{ fontSize: "0.9rem" }}>{t("Monitor your ticket status through our interactive Kanban boards.")}</p>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⚡</div>
          <h3>{t("Rapid Response")}</h3>
          <p className="muted" style={{ fontSize: "0.9rem" }}>{t("Direct routing to specialized teams ensures your issues are seen immediately.")}</p>
        </div>
      </div>
    </div>
  );
}


export default function App() {
  useEffect(() => {
    const theme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", theme);
  }, []);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/test" element={<HomePage />} />

      <Route
        path="/profile"
        element={
          <ProtectedRoute roles={["requester", "responsible", "agent", "supervisor", "admin", "superadmin"]}>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/requester"
        element={
          <ProtectedRoute roles={["requester", "responsible", "agent", "supervisor"]}>
            <RequesterHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/requester/new"
        element={
          <ProtectedRoute roles={["requester", "responsible", "agent", "supervisor"]}>
            <CreateTicket />
          </ProtectedRoute>
        }
      />
      <Route
        path="/requester/ticket/:id"
        element={
          <ProtectedRoute roles={["requester", "responsible", "agent", "supervisor"]}>
            <RequesterTicket />
          </ProtectedRoute>
        }
      />

      <Route
        path="/responsible/approvals"
        element={
          <ProtectedRoute roles={["responsible"]}>
            <ResponsibleApprovals />
          </ProtectedRoute>
        }
      />
      <Route
        path="/responsible/ticket/:id"
        element={
          <ProtectedRoute roles={["responsible"]}>
            <ResponsibleTicket />
          </ProtectedRoute>
        }
      />
      <Route
        path="/responsible/team"
        element={
          <ProtectedRoute roles={["responsible"]}>
            <ResponsibleTeam />
          </ProtectedRoute>
        }
      />

      <Route
        path="/agent"
        element={
          <ProtectedRoute roles={["agent"]}>
            <AgentHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agent/ticket/:id"
        element={
          <ProtectedRoute roles={["agent"]}>
            <AgentTicket />
          </ProtectedRoute>
        }
      />

      <Route
        path="/supervisor"
        element={
          <ProtectedRoute roles={["supervisor"]}>
            <SupervisorTracking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/supervisor/tracking"
        element={
          <ProtectedRoute roles={["supervisor"]}>
            <SupervisorTracking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/supervisor/ticket/:id"
        element={
          <ProtectedRoute roles={["supervisor"]}>
            <SupervisorTicket />
          </ProtectedRoute>
        }
      />
      <Route
        path="/supervisor/agents"
        element={
          <ProtectedRoute roles={["supervisor"]}>
            <SupervisorAgents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/supervisor/agents/:id"
        element={
          <ProtectedRoute roles={["supervisor"]}>
            <SupervisorAgentProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/timeline/:id"
        element={
          <ProtectedRoute roles={["supervisor", "admin", "superadmin"]}>
            <TicketTimeline />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminTickets />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/departments"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminDepartments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/problems"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminProblems />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tickets"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminTickets />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/ticket/:id"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminTicket />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/statistics"
        element={
          <ProtectedRoute roles={["admin"]}>
            <StatisticsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/superadmin"
        element={
          <ProtectedRoute roles={["superadmin"]}>
            <SuperadminHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/tickets"
        element={
          <ProtectedRoute roles={["superadmin"]}>
            <AdminTickets />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/users"
        element={
          <ProtectedRoute roles={["superadmin"]}>
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/ticket/:id"
        element={
          <ProtectedRoute roles={["superadmin"]}>
            <AdminTicket />
          </ProtectedRoute>
        }
      />
      <Route
        path="/superadmin/statistics"
        element={
          <ProtectedRoute roles={["superadmin"]}>
            <StatisticsPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
