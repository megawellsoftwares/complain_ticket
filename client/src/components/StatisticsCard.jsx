import { useTranslation } from "react-i18next";

export function StatisticsCard({ stats }) {
  const { t } = useTranslation();
  if (!stats) return null;

  return (
    <div className="grid2" style={{ marginBottom: "2rem" }}>
      <div className="card stack">
        <h3>{t("Overview")}</h3>
        <p>{t("Total Tickets")}: <strong>{stats.totals?.tickets || 0}</strong></p>
        <p>{t("Top Department")}: <strong>{stats.topDept?.name || "—"}</strong> ({stats.topDept?.count || 0})</p>
        <p>{t("Avg. Resolution Time")}: <strong>{stats.avgResolutionTimeHrs}h</strong></p>
      </div>
      <div className="card stack">
        <h3>{t("Agent Performance")}</h3>
        <div style={{ maxHeight: "150px", overflow: "auto" }}>
          {stats.agentStats?.length ? (
            <table className="data" style={{ fontSize: "0.85rem" }}>
              <thead>
                <tr>
                  <th>{t("Agent")}</th>
                  <th>{t("Solved/Closed")}</th>
                </tr>
              </thead>
              <tbody>
                {stats.agentStats.map((a, i) => (
                  <tr key={i}>
                    <td>{a.name}</td>
                    <td>{a.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">{t("No agent data yet.")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
