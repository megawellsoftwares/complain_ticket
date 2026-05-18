import { useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { roleHome } from "../utils/roleHome.js";

import { useTranslation } from "react-i18next";

export default function LoginPage() {
  const { user, login } = useAuth();
  const { t } = useTranslation();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  if (user) {
    const to = loc.state?.from?.pathname || roleHome(user.role);
    return <Navigate to={to} replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      const u = await login(email, password);
      nav(loc.state?.from?.pathname || roleHome(u.role), { replace: true });
    } catch (e2) {
      setErr(e2.message || t("Login failed"));
    }
  }

  return (
    <div className="layout" style={{ maxWidth: 420 }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <img src="/logo.png" alt="ashki logo" style={{ height: "80px", marginBottom: "1rem" }} />
        <h1 style={{ margin: 0, color: "var(--accent)", fontSize: "2.5rem", fontWeight: 800 }}>ashki</h1>
        <p className="muted" style={{ marginTop: "0.5rem" }}>
          {t("Complaint desk — use the account your administrator provisioned.")}
        </p>
      </div>
      {err ? <div className="error-banner">{err}</div> : null}
      <form className="card" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="email">{t("Email")}</label>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@company.com" required />
        </div>
        <div className="field">
          <label htmlFor="password">{t("Password")}</label>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
          {t("Sign in")}
        </button>
      </form>
    </div>
  );
}

