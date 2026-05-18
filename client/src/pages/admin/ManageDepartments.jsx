import { useEffect, useState } from "react";
import { api } from "../../api.js";
import { AppLayout } from "../../components/AppLayout.jsx";

export default function ManageDepartments() {
  const [list, setList] = useState([]);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const res = await api("/department");
      setList(res.data || []);
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await api("/department", { method: "POST", body: { name } });
      setName("");
      await load();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    if (!confirm("Delete this department?")) return;
    setErr("");
    try {
      await api(`/department/${id}`, { method: "DELETE" });
      await load();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");

  async function update(e) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setErr("");
    try {
      await api(`/department/${editing._id}`, { method: "PUT", body: { name: editName } });
      setEditing(null);
      await load();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  function startEdit(d) {
    setEditing(d);
    setEditName(d.name);
  }

  return (
    <AppLayout title="Departments">
      {err ? <div className="error-banner">{err}</div> : null}
      
      {editing ? (
        <form className="card" onSubmit={update} style={{ marginBottom: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>Edit department</h3>
          <div className="field" style={{ marginBottom: "0.75rem" }}>
            <label>Name</label>
            <input value={editName} onChange={(e) => setEditName(e.target.value)} required />
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
      ) : (
        <form className="card" onSubmit={create} style={{ marginBottom: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>Add department</h3>
          <div className="field" style={{ marginBottom: "0.75rem" }}>
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Create
          </button>
        </form>
      )}

      <div className="card" style={{ padding: 0, overflow: "auto" }}>
        <table className="data">
          <thead>
            <tr>
              <th>Name</th>
              <th>Id</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((d) => (
              <tr key={d._id}>
                <td>{d.name}</td>
                <td className="muted" style={{ fontSize: "0.8rem" }}>
                  {d._id}
                </td>
                <td>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button type="button" className="btn btn-ghost" style={{ padding: "0.25rem 0.5rem" }} onClick={() => startEdit(d)}>
                      Edit
                    </button>
                    <button type="button" className="btn btn-danger" style={{ padding: "0.25rem 0.5rem" }} onClick={() => remove(d._id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
