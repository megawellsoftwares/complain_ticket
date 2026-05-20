import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api.js";
import { AppLayout } from "../../components/AppLayout.jsx";
import { StatisticsCard } from "../../components/StatisticsCard.jsx";

export default function AdminHome() {
  const [counts, setCounts] = useState({ users: "—", tickets: "—" });
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const usersRaw = await api("/user");
        const users = Array.isArray(usersRaw) ? usersRaw : usersRaw?.data || [];
        const sRes = await api("/stats/general");
        setStats(sRes.data);
        setCounts({ users: users.length, tickets: sRes.data?.totalTickets || 0 });
      } catch {
        setCounts({ users: "?", tickets: "?" });
      }
    })();
  }, []);

  return (
    <AppLayout title="Admin overview">
      
    </AppLayout>
  );
}
