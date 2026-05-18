import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api.js";
import { AppLayout } from "../../components/AppLayout.jsx";

const emptyForm = {
  firstName: "",
  lastName: "",
  userName: "",
  email: "",
  phone: "",
  anyDesk: "",
};

export default function ResponsibleTeamPage() {
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    setErr("");
    try {
      const res = await api("/user/department/requesters");
      setUsers(res.data || []);
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const res = await api("/user/department/requesters", { method: "POST", body: form });
      setMsg(res.message || "Requester created.");
      setShowAdd(false);
      setForm(emptyForm);
      await load();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppLayout title="Department requesters">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <p className="muted" style={{ margin: 0 }}>Create and manage requester accounts in your department.</p>
        <button type="button" className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? "Cancel" : "Add requester"}
        </button>
      </div>

      {err ? <div className="error-banner">{err}</div> : null}
      {msg ? <div className="success-banner">{msg}</div> : null}

      {showAdd ? (
        <form className="card stack" onSubmit={handleAdd} style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ marginTop: 0 }}>Create requester</h3>
          <p className="muted" style={{ marginTop: 0 }}>Login credentials will be emailed automatically.</p>
          <div className="grid2">
            <div className="field">
              <label>First name</label>
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required autoComplete="off" />
            </div>
            <div className="field">
              <label>Last name</label>
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required autoComplete="off" />
            </div>
            <div className="field">
              <label>Username</label>
              <input value={form.userName} onChange={(e) => setForm({ ...form, userName: e.target.value })} required autoComplete="off" />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="off" />
            </div>
            <div className="field">
              <label>Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required placeholder="06XXXXXXXX" autoComplete="off" />
            </div>
            <div className="field">
              <label>AnyDesk ID</label>
              <input value={form.anyDesk} onChange={(e) => setForm({ ...form, anyDesk: e.target.value })} placeholder="Optional" autoComplete="off" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy} style={{ alignSelf: "flex-start" }}>
            Create & email credentials
          </button>
        </form>
      ) : null}

      <div className="card" style={{ padding: 0, overflow: "auto" }}>
        <table className="data">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Phone</th>
              <th>AnyDesk</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.firstName} {u.lastName}</td>
                <td>{u.userName}</td>
                <td>{u.email}</td>
                <td>{u.phone || "—"}</td>
                <td>{u.anyDesk || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: "1rem" }}>
        <Link to="/requester" className="muted">
          ← My tickets
        </Link>
      </p>
    </AppLayout>
  );
}
