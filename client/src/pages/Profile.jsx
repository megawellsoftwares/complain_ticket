import { useState, useEffect } from "react";
import { api } from "../api.js";
import { AppLayout } from "../components/AppLayout.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { useTranslation } from "react-i18next";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { t } = useTranslation();

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [userName, setUserName] = useState(user?.userName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [password, setPassword] = useState("");

  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setUserName(user.userName || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    setBusy(true);

    try {
      const payload = { firstName, lastName, userName, phone };
      if (password.trim()) {
        payload.password = password;
      }

      const res = await api("/user", {
        method: "PUT",
        body: payload,
      });

      await refreshUser();
      setMsg(t("Profile updated successfully!"));
      setPassword(""); // Clear password field after success
    } catch (e2) {
      setErr(e2.message || t("Update failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppLayout title={t("Profile Management")}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        {err && <div className="error-banner" style={{ marginBottom: "1rem" }}>{err}</div>}
        {msg && <div className="success-banner" style={{ marginBottom: "1rem" }}>{msg}</div>}

        <form className="card stack" onSubmit={handleSubmit}>
          <div className="grid2" style={{ gap: "1rem" }}>
            <div className="field">
              <label htmlFor="firstName">{t("First Name")}</label>
              <input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required autoComplete="off" />
            </div>
            <div className="field">
              <label htmlFor="lastName">{t("Last Name")}</label>
              <input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required autoComplete="off" />
            </div>
          </div>

          <div className="field">
            <label htmlFor="userName">{t("Username")}</label>
            <input id="userName" value={userName} onChange={(e) => setUserName(e.target.value)} required autoComplete="off" />
          </div>

          <div className="field">
            <label htmlFor="phone">{t("Phone")}</label>
            <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required autoComplete="off" />
          </div>

          <div className="field" style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginTop: "0.5rem" }}>
            <label htmlFor="password">{t("Change Password (optional)")}</label>
            <input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder={t("Leave blank to keep current password")} 
              autoComplete="new-password" 
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={busy} style={{ alignSelf: "flex-start", marginTop: "1rem" }}>
            {busy ? t("Saving…") : t("Save Changes")}
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
