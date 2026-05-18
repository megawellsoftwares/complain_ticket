import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../api.js";
import { AppLayout } from "../../components/AppLayout.jsx";

export default function SupervisorAgentProfilePage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  
  const [isEditing, setIsEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    email: "",
    phone: "",
    anyDesk: ""
  });

  async function loadData() {
    try {
      const res = await api(`/user/agents/${id}/profile`);
      setData(res.data);
      if (res.data?.agent) {
        setForm({
          firstName: res.data.agent.firstName || "",
          lastName: res.data.agent.lastName || "",
          userName: res.data.agent.userName || "",
          email: res.data.agent.email || "",
          phone: res.data.agent.phone || "",
          anyDesk: res.data.agent.anyDesk || ""
        });
      }
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  const agent = data?.agent;
  const counts = data?.ticketsByStatus || [];

  async function handleUpdate(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const res = await api(`/user/agents/${id}`, { method: "PUT", body: form });
      setMsg(res.message || "Agent updated successfully!");
      setIsEditing(false);
      await loadData();
    } catch (error) {
      setErr(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppLayout title="Agent profile">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <Link to="/supervisor/agents" className="muted">
          ← Agents
        </Link>
        {agent && (
          <button className="btn btn-ghost" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? "Cancel Edit" : "Edit Agent"}
          </button>
        )}
      </div>
      
      {err ? <div className="error-banner" style={{ marginBottom: "1rem" }}>{err}</div> : null}
      {msg ? <div className="success-banner" style={{ marginBottom: "1rem" }}>{msg}</div> : null}
      
      {agent ? (
        <div className="card stack">
          {isEditing ? (
            <form onSubmit={handleUpdate} className="stack">
              <h3 style={{ marginTop: 0 }}>Edit Agent Details</h3>
              <div className="grid2">
                <div className="field">
                  <label>First name</label>
                  <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
                </div>
                <div className="field">
                  <label>Last name</label>
                  <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
                </div>
                <div className="field">
                  <label>Username</label>
                  <input value={form.userName} onChange={(e) => setForm({ ...form, userName: e.target.value })} required />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="field">
                  <label>Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                </div>
                <div className="field">
                  <label>AnyDesk ID</label>
                  <input value={form.anyDesk} onChange={(e) => setForm({ ...form, anyDesk: e.target.value })} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={busy} style={{ alignSelf: "flex-start" }}>
                {busy ? "Saving..." : "Save Changes"}
              </button>
            </form>
          ) : (
            <>
              <h2 style={{ margin: 0 }}>{agent.userName}</h2>
              <p className="muted" style={{ margin: 0 }}>
                {agent.email} · {agent.phone ? (
                  <a 
                    href={`https://api.whatsapp.com/send?phone=${agent.phone.replace(/\D/g, "").replace(/^0/, "213")}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    style={{ color: "inherit", textDecoration: "underline" }}
                  >
                    {agent.phone}
                  </a>
                ) : "no phone"}
                {agent.anyDesk && ` · AnyDesk: ${agent.anyDesk}`}
              </p>
              <p style={{ margin: 0 }}>
                Department: <strong>{agent.department?.name || "—"}</strong>
              </p>
              <div className="grid2">
                <div className="card" style={{ background: "var(--bg)" }}>
                  <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>Status Overview</h3>
                  {!counts.length ? (
                    <p className="muted">No assignment history yet.</p>
                  ) : (
                    <ul className="stack" style={{ margin: 0, padding: 0, listStyle: "none", gap: "0.25rem" }}>
                      {counts.map((c) => (
                        <li key={c._id || "na"} style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ textTransform: "capitalize" }}>{c._id}</span>
                          <strong>{c.count}</strong>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="card" style={{ background: "var(--bg)" }}>
                  <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>Performance Stats</h3>
                  <div className="stack" style={{ gap: "0.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Resolved Total:</span>
                      <strong className="success-text">{data.performance.resolvedTotal}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Avg. Resolution:</span>
                      <strong>{data.performance.avgTimeHrs.toFixed(1)} hrs</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Could not resolve:</span>
                      <strong className="danger-text">{data.performance.escalatedCount}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : !err ? (
        <p className="muted">Loading…</p>
      ) : null}
    </AppLayout>
  );
}
