export function roleHome(role) {
  if (role === "admin") return "/admin";
  if (role === "supervisor") return "/supervisor";
  if (role === "agent") return "/agent";
  if (role === "superadmin") return "/superadmin";
  if (role === "responsible") return "/requester";
  return "/requester";
}
