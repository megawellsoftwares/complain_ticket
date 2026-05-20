  import { useEffect, useState } from "react";
  import { Link } from "react-router-dom";
  import { api } from "../../api.js";
  import { AppLayout } from "../../components/AppLayout.jsx";
  import { KanbanBoard } from "../../components/KanbanBoard.jsx";
  import { StatisticsCard } from "../../components/StatisticsCard.jsx";

  const KANBAN_COLUMNS = ["received", "seen-admin", "seen-supervisor", "dispatched", "seen-agent", "in-progress", "pending-confirmation", "fermer"];

  export default function SupervisorHome() {
    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState(null);
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      (async () => {
        setLoading(true);
        try {
          const [tRes, sRes] = await Promise.all([
            api("/ticket"),
            api("/stats/general")
          ]);
          setTickets(tRes.data || []);
          setStats(sRes.data);
        } catch (e) {
          setErr(e.message);
        } finally {
          setLoading(false);
        }
      })();
    }, []);

    useEffect(() => {
      let mounted = true;
      import("../../socket.js").then(({ default: socket, connectSocket }) => {
        connectSocket();
        socket.on("ticket:created", (t) => {
          if (!mounted) return;
          setTickets((prev) => [t, ...(prev || [])]);
        });
        socket.on("ticket:updated", (t) => {
          if (!mounted) return;
          setTickets((prev) => {
            if (!prev) return [t];
            const idx = prev.findIndex((x) => x._id === t._id);
            if (idx === -1) return [t, ...prev];
            const copy = [...prev];
            copy[idx] = t;
            return copy;
          });
        });
      });
      return () => { mounted = false; };
    }, []);

    return (
      <AppLayout title="Supervisor Dashboard">
      </AppLayout>
    );
  }
