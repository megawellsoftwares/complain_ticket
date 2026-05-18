import { useEffect, useState } from "react";
import { api } from "../../api.js";
import { AppLayout } from "../../components/AppLayout.jsx";

export default function ManageProblems() {
  const [problems, setProblems] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pName, setPName] = useState("");
  const [pDept, setPDept] = useState("");
  const [pTier, setPTier] = useState("low");
  const [sName, setSName] = useState("");
  const [sProblem, setSProblem] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const res = await api("/issue/all");
      setProblems(res.data || []);
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

  async function addProblem(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await api("/issue/problem", { method: "POST", body: { name: pName, department: pDept, tier: pTier } });
      setPName("");
      setPTier("low");
      await load();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  async function addSub(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await api("/issue/subproblem", { method: "POST", body: { name: sName, problem: sProblem } });
      setSName("");
      await load();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  async function delProblem(id) {
    if (!confirm("Delete this problem?")) return;
    setErr("");
    try {
      await api(`/issue/problem/${id}`, { method: "DELETE" });
      await load();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  return (
    <AppLayout title="Problems catalog">
      {err ? <div className="error-banner">{err}</div> : null}
      <div className="grid2">
        <form className="card" onSubmit={addProblem}>
          <h3 style={{ marginTop: 0 }}>New problem type</h3>
          <div className="field" style={{ marginBottom: "0.5rem" }}>
            <label>Serving department</label>
            <select value={pDept} onChange={(e) => setPDept(e.target.value)} required>
              <option value="">Select…</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ marginBottom: "0.5rem" }}>
            <label>Visibility tier</label>
            <select value={pTier} onChange={(e) => setPTier(e.target.value)}>
              <option value="low">Low — requesters can open tickets</option>
              <option value="high">High — only department responsible (or admin)</option>
            </select>
          </div>
          <div className="field" style={{ marginBottom: "0.75rem" }}>
            <label>Problem name</label>
            <input value={pName} onChange={(e) => setPName(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Add problem
          </button>
        </form>
        <form className="card" onSubmit={addSub}>
          <h3 style={{ marginTop: 0 }}>New sub-problem</h3>
          <div className="field" style={{ marginBottom: "0.5rem" }}>
            <label>Parent problem</label>
            <select value={sProblem} onChange={(e) => setSProblem(e.target.value)} required>
              <option value="">Select…</option>
              {problems.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.department?.name})
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ marginBottom: "0.75rem" }}>
            <label>Sub-problem name</label>
            <input value={sName} onChange={(e) => setSName(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Add sub-problem
          </button>
        </form>
      </div>
      <div className="card" style={{ marginTop: "1rem", padding: 0, overflow: "auto" }}>
        <table className="data">
          <thead>
            <tr>
              <th>Problem</th>
              <th>Department</th>
              <th>Tier</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {problems.map((p) => (
              <tr key={p._id}>
                <td>{p.name}</td>
                <td>{p.department?.name || "—"}</td>
                <td style={{ textTransform: "capitalize" }}>{p.tier || "low"}</td>
                <td>
                  <button type="button" className="btn btn-danger" style={{ padding: "0.25rem 0.5rem" }} onClick={() => delProblem(p._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
