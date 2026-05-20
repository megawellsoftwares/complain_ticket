import { useEffect, useState } from "react";
import { api } from "../../api.js";
import { AppLayout } from "../../components/AppLayout.jsx";
import { useTranslation } from "react-i18next";

export default function StatisticsPage() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api("/stats/general");
        setData(res.data);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <AppLayout title={t("Statistics")}><p className="muted">{t("Loading statistics…")}</p></AppLayout>;
  if (err) return <AppLayout title={t("Statistics")}><div className="error-banner">{err}</div></AppLayout>;

  const { totals, statusStats, ticketsByDept, usersByRole, agentStats, topSubProblems } = data;

  return (
    <AppLayout title={t("Analytics Dashboard")}>
      <div className="stack" style={{ gap: "2rem" }}>
        
        {/* Totals Row */}
        <div className="grid2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <div className="card" style={{ borderLeft: "4px solid var(--accent)" }}>
            <p className="muted" style={{ fontSize: "0.8rem", textTransform: "uppercase", fontWeight: "700" }}>{t("Total Tickets")}</p>
            <h2 style={{ fontSize: "2.5rem", margin: "0.5rem 0" }}>{totals.tickets}</h2>
          </div>
          <div className="card" style={{ borderLeft: "4px solid #af52de" }}>
            <p className="muted" style={{ fontSize: "0.8rem", textTransform: "uppercase", fontWeight: "700" }}>{t("Total Users")}</p>
            <h2 style={{ fontSize: "2.5rem", margin: "0.5rem 0" }}>{totals.users}</h2>
          </div>
          <div className="card" style={{ borderLeft: "4px solid var(--warning)" }}>
            <p className="muted" style={{ fontSize: "0.8rem", textTransform: "uppercase", fontWeight: "700" }}>{t("Departments")}</p>
            <h2 style={{ fontSize: "2.5rem", margin: "0.5rem 0" }}>{totals.departments}</h2>
          </div>
        </div>

        <div className="grid2">
          {/* Tickets by Status */}
          <div className="card">
            <h3>{t("Tickets by Status")}</h3>
            <div className="stack" style={{ marginTop: "1rem", gap: "0.75rem" }}>
              {statusStats.map(s => (
                <div key={s._id} className="stack" style={{ gap: "0.35rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                    <span style={{ textTransform: "capitalize" }}>{t(`status.${s._id}`)}</span>
                    <strong>{s.count}</strong>
                  </div>
                  <div style={{ height: "8px", background: "var(--surface2)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ 
                      height: "100%", 
                      width: `${(s.count / totals.tickets) * 100}%`, 
                      background: getStatusColor(s._id) 
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Recurring Issues */}
          <div className="card">
            <h3>{t("Top Recurring Issues")}</h3>
            <div className="stack" style={{ marginTop: "1rem", gap: "0.75rem" }}>
              {topSubProblems.map(sp => (
                <div key={sp.name} className="stack" style={{ gap: "0.35rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                    <span>{sp.name}</span>
                    <strong>{sp.count}</strong>
                  </div>
                  <div style={{ height: "8px", background: "var(--surface2)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ 
                      height: "100%", 
                      width: `${(sp.count / totals.tickets) * 100}%`, 
                      background: "var(--brand-secondary)" 
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid2">
          {/* Users by Role */}
          <div className="card">
            <h3>{t("User Distribution")}</h3>
            <div className="stack" style={{ marginTop: "1rem", gap: "0.75rem" }}>
              {usersByRole.map(r => (
                <div key={r._id} className="stack" style={{ gap: "0.35rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                    <span style={{ textTransform: "capitalize" }}>{t(`role.${r._id}`)}</span>
                    <strong>{r.count}</strong>
                  </div>
                  <div style={{ height: "8px", background: "var(--surface2)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ 
                      height: "100%", 
                      width: `${(r.count / totals.users) * 100}%`, 
                      background: "var(--accent)" 
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tickets by Department */}
          <div className="card">
            <h3>{t("Departmental Load")}</h3>
            <div className="stack" style={{ marginTop: "1rem", gap: "0.75rem" }}>
              {ticketsByDept.map(d => (
                <div key={d.name} className="stack" style={{ gap: "0.35rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                    <span>{d.name}</span>
                    <strong>{d.count}</strong>
                  </div>
                  <div style={{ height: "8px", background: "var(--surface2)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ 
                      height: "100%", 
                      width: `${(d.count / totals.tickets) * 100}%`, 
                      background: "var(--warning)" 
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Agent Performance */}
        <div className="card">
          <h3>{t("Top Performing Agents")}</h3>
          <div style={{ overflowX: "auto", marginTop: "1rem" }}>
            <table className="data">
              <thead>
                <tr>
                  <th>{t("Agent")}</th>
                  <th>{t("Resolved")}</th>
                  <th>{t("Escalated")}</th>
                  <th>{t("Avg. Time")}</th>
                </tr>
              </thead>
              <tbody>
                {(agentStats || []).map(a => (
                  <tr key={a.name}>
                    <td><strong>{a.name}</strong></td>
                    <td>{a.count}</td>
                    <td><span className={a.escalated > 0 ? "danger-text" : ""}>{a.escalated}</span></td>
                    <td>{a.avgHrs}h</td>
                  </tr>
                ))}
                {(!agentStats || !agentStats.length) && (
                  <tr>
                    <td colSpan="4" className="muted" style={{ textAlign: "center" }}>{t("No resolution data yet.")}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}

function getStatusColor(status) {
  switch(status) {
    case "closed": return "#8e8e93";
    case "resolved":
    case "solved":
    case "pending-confirmation": return "var(--success)";
    case "in-progress": return "#3d8bfd";
    case "assigned": return "#af52de";
    case "seen": return "#5ac8fa";
    default: return "var(--warning)";
  }
}
