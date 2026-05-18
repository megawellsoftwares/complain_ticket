import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "../../api.js";
import { AppLayout } from "../../components/AppLayout.jsx";

const ROLE_ORDER = ["superadmin", "admin", "supervisor", "responsible", "agent", "requester"];

export default function AdminUsers() {
  const loc = useLocation();
  const readOnly = loc.pathname.startsWith("/superadmin");
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState(null);
  const [role, setRole] = useState("requester");
  const [department, setDepartment] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [busy, setBusy] = useState(false);

  // New user state
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    email: "",
    password: "",
    phone: "",
    anyDesk: "",
    role: "requester",
    department: ""
  });

  async function handleAdd(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await api("/user", { method: "POST", body: newUser });
      setMsg("User created successfully.");
      setShowAdd(false);
      setNewUser({ firstName: "", lastName: "", userName: "", email: "", password: "", phone: "", anyDesk: "", role: "requester", department: "" });
      await load();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  const sortedUsers = useMemo(() => {
    const list = [...users];
    list.sort((a, b) => {
      const ra = ROLE_ORDER.indexOf(a.role);
      const rb = ROLE_ORDER.indexOf(b.role);
      if (ra !== rb) return (ra === -1 ? 99 : ra) - (rb === -1 ? 99 : rb);
      return (a.userName || "").localeCompare(b.userName || "");
    });
    return list;
  }, [users]);

  async function load() {
    setErr("");
    try {
      const raw = await api("/user");
      setUsers(Array.isArray(raw) ? raw : raw?.data || []);
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await api("/department");
        setDepartments(res.data || []);
      } catch {
        setDepartments([]);
      }
    })();
  }, []);

  function openEdit(u) {
    setEditing(u);
    setRole(u.role || "requester");
    setDepartment(u.department?._id || u.department || "");
    setIsActive(!!u.isActive);
    setMsg("");
  }

  async function saveRole(e) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setErr("");
    try {
      await api(`/user/user-role/${editing._id}`, {
        method: "PUT",
        body: {
          role,
          department: department || undefined,
          isActive
        },
      });
      setMsg(`Updated ${editing.userName}.`);
      setEditing(null);
      await load();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppLayout title={readOnly ? "Users (read-only)" : "Users"}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        {readOnly ? <p className="muted" style={{ margin: 0 }}>Super-admin: directory is view-only.</p> : <p className="muted" style={{ margin: 0 }}>{users.length} users registered.</p>}
        {!readOnly && (
          <button type="button" className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? "Cancel" : "Add User"}
          </button>
        )}
      </div>

      {err ? <div className="error-banner">{err}</div> : null}
      {msg ? <div className="success-banner">{msg}</div> : null}

      {showAdd && !readOnly && (
        <form className="card stack" onSubmit={handleAdd} style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ marginTop: 0 }}>Create New User</h3>
          <div className="grid2">
            <div className="field">
              <label>First Name</label>
              <input value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})} required autoComplete="off" />
            </div>
            <div className="field">
              <label>Last Name</label>
              <input value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})} required autoComplete="off" />
            </div>
            <div className="field">
              <label>Username</label>
              <input value={newUser.userName} onChange={e => setNewUser({...newUser, userName: e.target.value})} required autoComplete="off" />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required autoComplete="off" />
            </div>
            <div className="field">
              <label>Phone</label>
              <input value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} required placeholder="06XXXXXXXX" autoComplete="off" />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="Leave blank to auto-generate" minLength={6} autoComplete="new-password" />
            </div>
            <div className="field">
              <label>AnyDesk ID</label>
              <input value={newUser.anyDesk} onChange={e => setNewUser({...newUser, anyDesk: e.target.value})} placeholder="Optional" autoComplete="off" />
            </div>
            <div className="field">
              <label>Role</label>
              <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                {ROLE_ORDER.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Department</label>
              <select value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value})} required>
                <option value="">Select...</option>
                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy} style={{ alignSelf: "flex-start" }}>
            Save User
          </button>
        </form>
      )}
      <div className="card" style={{ padding: 0, overflow: "auto" }}>
        <table className="data">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Status</th>
              {!readOnly ? <th /> : null}
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((u) => (
              <tr key={u._id}>
                <td>{u.firstName} {u.lastName}</td>
                <td>{u.userName}</td>
                <td>{u.email}</td>
                <td style={{ textTransform: "capitalize" }}>{u.role}</td>
                <td>{u.department?.name || u.department || "—"}</td>
                <td>
                  <span className={u.isActive ? "status-tag resolved" : "status-tag closed"}>
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                {!readOnly ? (
                  <td>
                    <button type="button" className="btn btn-ghost" style={{ padding: "0.25rem 0.5rem" }} onClick={() => openEdit(u)}>
                      Role / dept
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!readOnly && editing ? (
        <div className="card stack" style={{ marginTop: "1rem" }}>
          <h3 style={{ margin: 0 }}>Update {editing.userName}</h3>
          <form onSubmit={saveRole} className="stack">
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="requester">requester</option>
                <option value="responsible">responsible (department)</option>
                <option value="agent">agent</option>
                <option value="supervisor">supervisor</option>
                <option value="admin">admin</option>
                <option value="superadmin">superadmin (read-only)</option>
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Department</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="">None</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-row" style={{ alignItems: "center", gap: "0.5rem" }}>
              <input 
                type="checkbox" 
                id="isActive" 
                checked={isActive} 
                onChange={(e) => setIsActive(e.target.checked)} 
              />
              <label htmlFor="isActive" style={{ margin: 0 }}>Account Activated</label>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                Save
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </AppLayout>
  );
}
