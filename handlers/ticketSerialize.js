/** Map legacy history statuses to current API labels */
export function mapTicketStatusForApi(status) {
  if (!status) return status;
  const m = {
    "seen-supervisor": "seen",
    "pending-confirmation": "solved",
    fermer: "closed",
    "pending-responsible": "received",
    resolved: "solved",
  };
  return m[status] || status;
}

/**
 * @param {object} ticket lean or plain object
 * @param {string} viewerRole
 */
export function serializeTicket(ticket, viewerRole) {
  if (!ticket) return ticket;
  const t = typeof ticket.toObject === "function" ? ticket.toObject() : { ...ticket };

  const mapped = mapTicketStatusForApi(t.status);
  t.status = mapped;
  t.effectiveStatus = mapped;

  return t;
}

export function serializeTickets(list, viewerRole) {
  return (list || []).map((x) => serializeTicket(x, viewerRole));
}
