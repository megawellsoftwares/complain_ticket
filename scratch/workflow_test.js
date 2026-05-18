/**
 * End-to-end workflow test via HTTP API.
 * Run: node scratch/workflow_test.js
 */
import "dotenv/config";
import fs from "fs";
import path from "path";

const BASE = process.env.API_BASE || "http://localhost:3001";
const PASS = process.env.TEST_PASSWORD || "123456";

const USERS = {
  requester: process.env.TEST_REQUESTER || "requester01@gmail.com",
  responsible: process.env.TEST_RESPONSIBLE || "responsible01@gmail.com",
  supervisor: process.env.TEST_SUPERVISOR || "supervisor01@gmail.com",
  agent: process.env.TEST_AGENT || "agent01@gmail.com",
};

const log = [];
function step(name, detail) {
  const line = detail ? `${name}: ${detail}` : name;
  log.push(line);
  console.log(line);
}

async function api(pathname, { token, method = "GET", body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const isForm = body instanceof FormData;
  if (!isForm && body != null) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE}${pathname}`, {
    method,
    headers,
    body: isForm ? body : body != null ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(data?.message || res.statusText);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function login(email) {
  const res = await api("/auth/login", {
    method: "POST",
    body: { email, password: PASS },
  });
  return { token: res.token, user: res.data };
}

function tinyVoiceFile() {
  const buf = Buffer.from([
    0x1a, 0x45, 0xdf, 0xa3, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x1f,
  ]);
  const filePath = path.join(process.cwd(), "uploads", "test-voice.webm");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buf);
  return filePath;
}

async function createTicket(token, subProblemId) {
  const filePath = tinyVoiceFile();
  const fd = new FormData();
  fd.append("subProblemId", subProblemId);
  fd.append("notes", "Workflow E2E test ticket");
  const blob = new Blob([fs.readFileSync(filePath)], { type: "audio/webm" });
  fd.append("voice", blob, "test-voice.webm");
  return api("/ticket", { token, method: "POST", body: fd });
}

async function getStatus(token, ticketId) {
  const res = await api(`/ticket/${ticketId}`, { token });
  return res.data?.status;
}

async function main() {
  step("=== Workflow E2E test ===");

  // Login all roles
  let requester, responsible, supervisor, agent;
  for (const [role, email] of Object.entries(USERS)) {
    try {
      const s = await login(email);
      if (role === "requester") requester = s;
      if (role === "responsible") responsible = s;
      if (role === "supervisor") supervisor = s;
      if (role === "agent") agent = s;
      step(`Login ${role}`, `${email} OK (${s.user.role})`);
    } catch (e) {
      step(`Login ${role} FAILED`, `${email}: ${e.message}`);
    }
  }

  if (!requester?.token || !supervisor?.token || !agent?.token) {
    throw new Error("Missing required test users. Set TEST_* env vars or ensure users exist with password 123456.");
  }

  // Find a low-tier sub-problem
  const issues = await api("/issue/all", { token: requester.token });
  const lowProblem = (issues.data || []).find((p) => (p.tier || "low") === "low");
  if (!lowProblem) throw new Error("No low-tier problem found");

  const subs = await api(`/issue/problem/${lowProblem._id}`, { token: requester.token });
  const subProblemId = subs.data?.[0]?._id;
  if (!subProblemId) throw new Error("No sub-problem found");

  // --- LOW PRIORITY FLOW ---
  step("--- Low priority ticket flow ---");
  const created = await createTicket(requester.token, subProblemId);
  const ticketId = created.data._id;
  step("Create ticket", `${created.data.ticketId} → status ${created.data.status}`);

  let status = await getStatus(supervisor.token, ticketId);
  step("Supervisor opens ticket", status);
  if (status !== "seen-supervisor") throw new Error(`Expected seen-supervisor, got ${status}`);

  const assigned = await api("/ticket/assign", {
    token: supervisor.token,
    method: "PATCH",
    body: { ticketId, agentId: agent.user._id },
  });
  step("Supervisor assigns agent", assigned.data.status);
  if (assigned.data.status !== "dispatched") throw new Error(`Expected dispatched, got ${assigned.data.status}`);

  status = await getStatus(agent.token, ticketId);
  step("Agent opens ticket", status);
  if (status !== "seen-agent") throw new Error(`Expected seen-agent, got ${status}`);

  const started = await api("/ticket/accept", {
    token: agent.token,
    method: "POST",
    body: { ticketId },
  });
  step("Agent starts work", started.data.status);
  if (started.data.status !== "in-progress") throw new Error(`Expected in-progress, got ${started.data.status}`);

  const solved = await api("/ticket/status", {
    token: agent.token,
    method: "PATCH",
    body: { ticketId, status: "pending-confirmation" },
  });
  step("Agent marks solved", solved.data.status);
  if (solved.data.status !== "pending-confirmation") throw new Error(`Expected pending-confirmation, got ${solved.data.status}`);

  const closed = await api("/ticket/respond-resolution", {
    token: requester.token,
    method: "POST",
    body: { ticketId, confirmed: true },
  });
  step("Requester confirms solved", closed.data?.status || "fermer");
  if (closed.data?.status !== "fermer") throw new Error(`Expected fermer, got ${closed.data?.status}`);

  // --- REOPEN SAME PROBLEM ---
  step("--- Reopen same problem flow ---");
  const created2 = await createTicket(requester.token, subProblemId);
  const ticketId2 = created2.data._id;
  step("Create ticket 2", created2.data.ticketId);

  await api(`/ticket/${ticketId2}`, { token: supervisor.token });
  await api("/ticket/assign", {
    token: supervisor.token,
    method: "PATCH",
    body: { ticketId: ticketId2, agentId: agent.user._id },
  });
  await api(`/ticket/${ticketId2}`, { token: agent.token });
  await api("/ticket/accept", { token: agent.token, method: "POST", body: { ticketId: ticketId2 } });
  await api("/ticket/status", {
    token: agent.token,
    method: "PATCH",
    body: { ticketId: ticketId2, status: "pending-confirmation" },
  });

  const fd = new FormData();
  fd.append("ticketId", ticketId2);
  fd.append("confirmed", "false");
  fd.append("sameProblem", "true");
  fd.append("notes", "Still broken after fix");
  const reopened = await api("/ticket/respond-resolution", {
    token: requester.token,
    method: "POST",
    body: fd,
  });
  step("Requester rejects (same problem)", reopened.data.status);
  if (reopened.data.status !== "dispatched") throw new Error(`Expected dispatched, got ${reopened.data.status}`);

  // --- HIGH PRIORITY (if responsible exists) ---
  if (responsible?.token) {
    step("--- High priority + responsible approval ---");
    const respIssues = await api("/issue/all", { token: responsible.token });
    const highProblem = (respIssues.data || []).find((p) => p.tier === "high");
    if (highProblem) {
      const highSubs = await api(`/issue/problem/${highProblem._id}`, { token: responsible.token });
      const highSubId = highSubs.data?.[0]?._id;
      if (highSubId) {
        const highCreated = await createTicket(responsible.token, highSubId);
        step("Responsible creates high ticket", `${highCreated.data.status} (${highCreated.data.ticketId})`);
        if (highCreated.data.status !== "pending-responsible") {
          throw new Error(`Expected pending-responsible, got ${highCreated.data.status}`);
        }

        const pending = await api("/ticket/pending-responsible", { token: responsible.token });
        const found = (pending.data || []).some((t) => t._id === highCreated.data._id);
        step("Pending queue lists ticket", found ? "yes" : "NO");

        const confirmed = await api(`/ticket/responsible/${highCreated.data._id}/confirm`, {
          token: responsible.token,
          method: "PATCH",
          body: {},
        });
        step("Responsible confirms", confirmed.data.status);
        if (confirmed.data.status !== "received") throw new Error(`Expected received, got ${confirmed.data.status}`);
      } else {
        step("High priority", "skipped — no sub-problem");
      }
    } else {
      step("High priority", "skipped — no high-tier problem");
    }
  } else {
    step("High priority", "skipped — no responsible user logged in");
  }

  step("=== ALL TESTS PASSED ===");
}

main().catch((err) => {
  console.error("\nTEST FAILED:", err.message);
  if (err.data) console.error(JSON.stringify(err.data, null, 2));
  process.exit(1);
});
