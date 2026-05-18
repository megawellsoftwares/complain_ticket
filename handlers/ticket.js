import path from "path";
import { StatusCodes } from "http-status-codes";
import ticketModel from "../models/ticket.js";
import userModel from "../models/users.js";
import problemModel from "../models/problem.js";
import { notifyUsers } from "../services/notify.js";
import { serializeTicket, serializeTickets } from "./ticketSerialize.js";
import subProblemModel from "../models/subProblem.js";
import ticketHistoryModel from "../models/ticketHistory.js";
import departmentModel from "../models/department.js";

async function recordHistory({ ticketId, action, user, fromStatus, toStatus, agent, note, voicePath }) {
  try {
    await ticketHistoryModel.create({
      ticket: ticketId,
      action,
      user,
      fromStatus,
      toStatus,
      agent,
      note,
      voicePath
    });
  } catch (err) {
    console.error("Error recording ticket history:", err);
  }
}

async function getPopulatedTicket(id) {
  return await ticketModel.findById(id)
    .populate({
      path: "requester",
      select: "userName email phone department",
      populate: { path: "department", select: "name" }
    })
    .populate("assignedAgent", "userName email phone")
    .populate("supervisor", "userName email phone")
    .populate({
      path: "subProblem",
      select: "name problem",
      populate: { path: "problem", select: "name tier department", populate: { path: "department", select: "name" } }
    });
}

async function getTicketStatus(ticketId) {
  const history = await ticketHistoryModel.find({ ticket: ticketId }).sort({ createdAt: -1 }).limit(1);
  return history.length > 0 ? history[0].toStatus : "received";
}

function voiceRelativePath(filePath) {
  if (!filePath) return filePath;
  try {
    return path.relative(process.cwd(), filePath).split(path.sep).join("/");
  } catch {
    return String(filePath).replace(/\\/g, "/");
  }
}

function assignedAgentId(ticket) {
  const a = ticket.assignedAgent;
  if (!a) return null;
  return a._id ? a._id.toString() : a.toString();
}

function requesterDeptId(ticket) {
  const dept = ticket.requester?.department;
  if (!dept) return null;
  return dept._id?.toString() || dept.toString();
}

async function populateTicketList(query) {
  return query
    .populate({
      path: "requester",
      select: "userName email phone department",
      populate: { path: "department", select: "name" },
    })
    .populate("assignedAgent", "userName email phone")
    .populate({
      path: "subProblem",
      select: "name problem",
      populate: {
        path: "problem",
        select: "name tier department",
        populate: { path: "department", select: "name" },
      },
    })
    .sort({ createdAt: -1 })
    .lean();
}

async function attachStatusAndDept(tickets) {
  return Promise.all(
    tickets.map(async (t) => {
      t.status = await getTicketStatus(t._id);
      t.servingDepartment = t.subProblem?.problem?.department;
      return t;
    }),
  );
}

export async function createTicket(req, res) {
  try {
    const { subProblemId } = req.body;
    const requester = req.user._id;
    const requesterDepartment = req.user.department;

    if (!requesterDepartment) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "User must belong to a department to create a ticket",
      });
    }

    const subProblem = await subProblemModel.findById(subProblemId).populate("problem");
    if (!subProblem || !subProblem.problem) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Sub-problem or associated problem type not found",
      });
    }

    const problem = subProblem.problem;
    const tier = problem.tier || "low";

    const voicePath = voiceRelativePath(req.file?.path);
    const priority = tier === "high" ? "high" : "low";
    const initialStatus = "received";

    const ticket = await ticketModel.create({
      requester,
      subProblem: subProblemId,
      voicePath,
      notes: req.body.notes,
      priority,
      status: initialStatus,
    });

    await recordHistory({
      ticketId: ticket._id,
      action: "created",
      user: requester,
      toStatus: initialStatus,
    });

    const supervisors = await userModel.find({
      role: "supervisor",
      department: problem.department,
    });
    await notifyUsers(
      supervisors.map((s) => s._id),
      {
        title: "New ticket",
        body: "A new ticket arrived in your department queue.",
        ticketId: ticket._id,
        type: "ticket_new",
      },
    );

    const populatedTicket = await getPopulatedTicket(ticket._id);
    const ticketObj = populatedTicket.toObject();
    ticketObj.status = initialStatus;
    ticketObj.servingDepartment = problem.department;

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: serializeTicket(ticketObj, req.user.role),
      message: "Ticket created successfully!",
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Error creating ticket",
      error: error.message,
    });
  }
}

export async function getAllTickets(req, res) {
  try {
    let tickets = await ticketModel
      .find()
      .populate({
        path: "requester",
        select: "userName email phone department",
        populate: {
          path: "department",
          select: "name",
        },
      })
      .populate("assignedAgent", "userName email phone department")
      .populate({
        path: "subProblem",
        select: "name problem",
        populate: {
          path: "problem",
          select: "name tier department",
          populate: { path: "department", select: "name" }
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    tickets = await Promise.all(tickets.map(async (t) => {
      t.status = await getTicketStatus(t._id);
      t.servingDepartment = t.subProblem?.problem?.department;
      return t;
    }));

    if (req.user.role === "supervisor") {
      const userDept = req.user.department?.toString();
      tickets = tickets.filter(t => t.servingDepartment?._id?.toString() === userDept || t.servingDepartment?.toString() === userDept);
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: serializeTickets(tickets, req.user.role),
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Error fetching tickets",
      error: error.message,
    });
  }
}

export async function getUnassignedTickets(req, res) {
  try {
    const filter = {
      $or: [{ assignedAgent: { $exists: false } }, { assignedAgent: null }]
    };

    let tickets = await ticketModel
      .find(filter)
      .populate({
        path: "requester",
        select: "userName email phone department",
        populate: {
          path: "department",
          select: "name",
        },
      })
      .populate({
        path: "subProblem",
        select: "name problem",
        populate: {
          path: "problem",
          select: "name tier department",
          populate: { path: "department", select: "name" }
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    tickets = await Promise.all(tickets.map(async (t) => {
      t.status = await getTicketStatus(t._id);
      t.servingDepartment = t.subProblem?.problem?.department;
      return t;
    }));

    tickets = tickets.filter(t => ["received", "seen", "seen-supervisor"].includes(t.status) || t.needsSupervisorReassign);

    if (req.user.role === "supervisor") {
      const userDept = req.user.department?.toString();
      tickets = tickets.filter(t => t.servingDepartment?._id?.toString() === userDept || t.servingDepartment?.toString() === userDept);
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: serializeTickets(tickets, req.user.role),
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Error fetching unassigned tickets",
      error: error.message,
    });
  }
}

export async function getMyTickets(req, res) {
  try {
    let tickets = await ticketModel
      .find({ requester: req.user._id })
      .populate({
        path: "requester",
        select: "userName email phone department",
        populate: { path: "department", select: "name" }
      })
      .populate("assignedAgent", "userName email phone")
      .populate({
        path: "subProblem",
        select: "name problem",
        populate: {
          path: "problem",
          select: "name tier department",
          populate: { path: "department", select: "name" }
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    tickets = await Promise.all(tickets.map(async (t) => {
      t.status = await getTicketStatus(t._id);
      t.servingDepartment = t.subProblem?.problem?.department;
      return t;
    }));

    res.status(StatusCodes.OK).json({
      success: true,
      data: serializeTickets(tickets, req.user.role),
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Error fetching your tickets",
      error: error.message,
    });
  }
}

export async function getAgentTickets(req, res) {
  try {
    let tickets = await ticketModel
      .find({ assignedAgent: req.user._id })
      .populate({
        path: "requester",
        select: "userName email phone department",
        populate: { path: "department", select: "name" }
      })
      .populate({
        path: "subProblem",
        select: "name problem",
        populate: {
          path: "problem",
          select: "name tier department",
          populate: { path: "department", select: "name" }
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    tickets = await Promise.all(tickets.map(async (t) => {
      t.status = await getTicketStatus(t._id);
      t.servingDepartment = t.subProblem?.problem?.department;
      return t;
    }));

    res.status(StatusCodes.OK).json({
      success: true,
      data: serializeTickets(tickets, req.user.role),
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Error fetching assigned tickets",
      error: error.message,
    });
  }
}

export async function assignTicket(req, res) {
  try {
    const { ticketId, agentId } = req.body;
    const supervisorId = req.user._id;

    const agent = await userModel.findOne({ _id: agentId, role: "agent" });
    if (!agent) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Agent not found or invalid role",
      });
    }

    const ticket = await ticketModel.findById(ticketId);
    if (!ticket) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const oldStatus = await getTicketStatus(ticket._id);
    const assignable =
      ["received", "seen", "seen-supervisor", "assigned"].includes(oldStatus) || ticket.needsSupervisorReassign;
    if (!assignable) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Ticket cannot be assigned in its current status",
      });
    }

    ticket.assignedAgent = agentId;
    ticket.supervisor = supervisorId;
    ticket.needsSupervisorReassign = false;
    await ticket.save();

    await recordHistory({
      ticketId: ticket._id,
      action: "assigned",
      user: supervisorId,
      fromStatus: oldStatus,
      toStatus: "dispatched",
      agent: agentId
    });

    await notifyUsers([agentId], {
      title: "Ticket assigned",
      body: "A supervisor assigned you a ticket.",
      ticketId: ticket._id,
      type: "ticket_assigned",
    });

    const populated = await getPopulatedTicket(ticket._id);
    const ticketObj = populated.toObject();
    ticketObj.status = "dispatched";
    ticketObj.servingDepartment = ticketObj.subProblem?.problem?.department;

    res.status(StatusCodes.OK).json({
      success: true,
      data: serializeTicket(ticketObj, req.user.role),
      message: "Ticket assigned successfully!",
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Error assigning ticket",
      error: error.message,
    });
  }
}

export async function updateTicketStatus(req, res) {
  try {
    const { ticketId, status } = req.body;

    let incoming = status;
    if (incoming === "resolved" || incoming === "solved") incoming = "pending-confirmation";

    if (incoming !== "pending-confirmation") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid status. Only "pending-confirmation" is supported for this action.',
      });
    }

    const ticket = await ticketModel.findById(ticketId);
    if (!ticket) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const isAssignedAgent = assignedAgentId(ticket) === req.user._id.toString();
    if (!isAssignedAgent && req.user.role !== "admin") {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Only the assigned agent can mark this ticket as solved",
      });
    }

    const oldStatus = await getTicketStatus(ticket._id);

    ticket.needsSupervisorReassign = false;
    ticket.status = incoming;
    await ticket.save();

    await recordHistory({
      ticketId: ticket._id,
      action: incoming,
      user: req.user._id,
      fromStatus: oldStatus,
      toStatus: incoming,
    });

    if (ticket.requester) {
      await notifyUsers([ticket.requester], {
        title: "Resolution proposed",
        body: "Please confirm whether your issue is solved.",
        ticketId: ticket._id,
        type: "ticket_solved",
      });
    }

    const populated = await getPopulatedTicket(ticket._id);
    const ticketObj = populated.toObject();
    ticketObj.status = incoming;
    ticketObj.servingDepartment = ticketObj.subProblem?.problem?.department;

    res.status(StatusCodes.OK).json({
      success: true,
      data: serializeTicket(ticketObj, req.user.role),
      message: "Ticket marked as solved — awaiting requester confirmation",
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Error updating ticket status",
      error: error.message,
    });
  }
}

export async function agentCannotSolve(req, res) {
  try {
    const { ticketId, notes } = req.body;
    const voicePath = voiceRelativePath(req.file?.path);
    const ticket = await ticketModel.findById(ticketId);
    if (!ticket) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Ticket not found" });
    }
    if (assignedAgentId(ticket) !== req.user._id.toString()) {
      return res.status(StatusCodes.FORBIDDEN).json({ success: false, message: "Not your assignment" });
    }

    const oldStatus = await getTicketStatus(ticket._id);
    ticket.assignedAgent = undefined;
    ticket.needsSupervisorReassign = true;
    ticket.isReopened = true;
    await ticket.save();

    await recordHistory({
      ticketId: ticket._id,
      action: "escalated",
      user: req.user._id,
      fromStatus: oldStatus,
      toStatus: "received",
      note: notes || "Agent escalated back to supervisor",
      voicePath
    });

    await ticket.populate({
      path: "subProblem",
      populate: { path: "problem" }
    });

    const supervisors = await userModel.find({
      role: "supervisor",
      department: ticket.subProblem?.problem?.department,
    });
    await notifyUsers(
      supervisors.map((s) => s._id),
      {
        title: "Agent could not resolve",
        body: "An agent escalated a ticket back for reassignment.",
        ticketId: ticket._id,
        type: "ticket_escalate",
      },
    );

    const populated = await getPopulatedTicket(ticket._id);
    const ticketObj = populated.toObject();
    ticketObj.status = "received";
    ticketObj.servingDepartment = ticketObj.subProblem?.problem?.department;

    res.status(StatusCodes.OK).json({
      success: true,
      data: serializeTicket(ticketObj, req.user.role),
      message: "Supervisor notified. Requester still sees the ticket as in progress.",
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Error escalating ticket",
      error: error.message,
    });
  }
}

export async function getTicketById(req, res) {
  try {
    const ticket = await ticketModel
      .findById(req.params.id)
      .populate({
        path: "requester",
        select: "userName email phone department",
        populate: {
          path: "department",
          select: "name",
        },
      })
      .populate("assignedAgent", "userName email phone")
      .populate("supervisor", "userName email phone")
      .populate({
        path: "subProblem",
        select: "name problem",
        populate: {
          path: "problem",
          select: "name tier department",
          populate: { path: "department", select: "name" }
        },
      });

    if (!ticket) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const role = req.user.role;
    const agentIdStr = assignedAgentId(ticket);
    const servingId = ticket.subProblem?.problem?.department?._id?.toString() || ticket.subProblem?.problem?.department?.toString();
    const requesterId = ticket.requester?._id?.toString() || ticket.requester?.toString();

    const isAdmin = role === "admin" || role === "superadmin";
    const requesterDept = requesterDeptId(ticket);
    const isSupervisor = role === "supervisor" && servingId === req.user.department?.toString();
    const isResponsible = role === "responsible" && requesterDept === req.user.department?.toString();
    const isAgent = role === "agent" && agentIdStr === req.user._id.toString();
    const isRequester = requesterId === req.user._id.toString();

    if (!isAdmin && !isSupervisor && !isResponsible && !isAgent && !isRequester) {
      return res.status(StatusCodes.FORBIDDEN).json({ success: false, message: "You don't have permission to view this ticket." });
    }

    const currentStatus = await getTicketStatus(ticket._id);

    if (role === "supervisor" && currentStatus === "received") {
      await recordHistory({
        ticketId: ticket._id,
        action: "seen",
        user: req.user._id,
        fromStatus: "received",
        toStatus: "seen",
      });
    }

    const refreshedStatus = await getTicketStatus(ticket._id);
    const isAssignedUser = agentIdStr === req.user._id.toString();
    if (isAssignedUser && refreshedStatus === "dispatched") {
      await recordHistory({
        ticketId: ticket._id,
        action: "seen-agent",
        user: req.user._id,
        fromStatus: "dispatched",
        toStatus: "seen-agent",
      });
    }

    const history = await ticketHistoryModel
      .find({ ticket: ticket._id })
      .populate("user", "userName role")
      .populate("agent", "userName")
      .sort({ createdAt: 1 });

    const ticketObj = ticket.toObject();
    ticketObj.status = await getTicketStatus(ticket._id); // Refresh status after possible update
    ticketObj.servingDepartment = ticketObj.subProblem?.problem?.department;

    const serialized = serializeTicket(ticketObj, role);
    serialized.history = history;

    res.status(StatusCodes.OK).json({
      success: true,
      data: serialized,
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Error fetching ticket details",
      error: error.message,
    });
  }
}

export async function respondToResolution(req, res) {
  try {
    const { ticketId, confirmed, sameProblem, notes } = req.body;
    const requesterId = req.user._id;

    const parseBool = (v) => {
      if (v === true || v === "true") return true;
      if (v === false || v === "false") return false;
      return undefined;
    };

    const ticket = await ticketModel.findById(ticketId);
    if (!ticket) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (ticket.requester.toString() !== requesterId.toString()) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Only the ticket opener can respond to resolution",
      });
    }

    const currentStatus = await getTicketStatus(ticket._id);
    const awaiting = ["solved", "pending-confirmation", "resolved"].includes(currentStatus);

    if (!awaiting) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Ticket must be awaiting your confirmation to respond",
      });
    }

    const isConfirmed = parseBool(confirmed);
    const isSameProblem = parseBool(sameProblem);

    if (isConfirmed === true) {
      ticket.needsSupervisorReassign = false;
      ticket.status = "fermer";
      await ticket.save();

      await recordHistory({
        ticketId: ticket._id,
        action: "fermer",
        user: requesterId,
        fromStatus: currentStatus,
        toStatus: "fermer",
        note: "Requester confirmed issue solved",
      });

      const populated = await getPopulatedTicket(ticket._id);
      const ticketObj = populated.toObject();
      ticketObj.status = "fermer";
      ticketObj.servingDepartment = ticketObj.subProblem?.problem?.department;

      return res.status(StatusCodes.OK).json({
        success: true,
        data: serializeTicket(ticketObj, req.user.role),
        message: "Ticket closed successfully",
      });
    }

    if (isSameProblem === true) {
      const voicePath = voiceRelativePath(req.file?.path);
      if (!notes && !voicePath) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Please provide a written note or voice recording explaining the issue",
        });
      }

      ticket.isReopened = true;
      ticket.needsSupervisorReassign = false;
      ticket.assignedAgent = undefined;
      ticket.supervisor = undefined;
      ticket.status = "received";
      await ticket.save();

      await recordHistory({
        ticketId: ticket._id,
        action: "reopened",
        user: requesterId,
        fromStatus: currentStatus,
        toStatus: "received",
        voicePath,
        note: notes || "Requester reported same problem not solved",
      });

      await ticket.populate({
        path: "subProblem",
        populate: { path: "problem" },
      });

      const supervisors = await userModel.find({
        role: "supervisor",
        department: ticket.subProblem?.problem?.department,
      });
      await notifyUsers(
        supervisors.map((s) => s._id),
        {
          title: "Requester needs more help",
          body: "The requester reported the issue is not fully resolved. The ticket is back in your queue as received.",
          ticketId: ticket._id,
          type: "ticket_reopened",
        },
      );

      const populated = await getPopulatedTicket(ticket._id);
      const ticketObj = populated.toObject();
      ticketObj.status = "received";
      ticketObj.servingDepartment = ticketObj.subProblem?.problem?.department;

      return res.status(StatusCodes.OK).json({
        success: true,
        data: serializeTicket(ticketObj, req.user.role),
        message: "Ticket returned to the supervisor queue as received",
      });
    }

    ticket.status = "fermer";
    await ticket.save();

    await recordHistory({
      ticketId: ticket._id,
      action: "fermer",
      user: requesterId,
      fromStatus: currentStatus,
      toStatus: "fermer",
      note: notes || "Requester reported a different problem — new ticket expected",
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      redirectToNewTicket: true,
      message: "This ticket is closed. Please create a new ticket for the different problem.",
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Error responding to resolution",
      error: error.message,
    });
  }
}

export async function acceptTicket(req, res) {
  try {
    const { ticketId } = req.body;
    const ticket = await ticketModel.findById(ticketId);
    if (!ticket) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Ticket not found" });
    }

    if (assignedAgentId(ticket) !== req.user._id.toString()) {
      return res.status(StatusCodes.FORBIDDEN).json({ success: false, message: "Not your assignment" });
    }

    const oldStatus = await getTicketStatus(ticket._id);
    const canStart = ["dispatched", "seen-agent", "assigned"].includes(oldStatus);
    if (!canStart) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Ticket must be dispatched before you can start work",
      });
    }

    ticket.status = "in-progress";
    await ticket.save();

    await recordHistory({
      ticketId: ticket._id,
      action: "in-progress",
      user: req.user._id,
      fromStatus: oldStatus,
      toStatus: "in-progress"
    });

    const populated = await getPopulatedTicket(ticket._id);
    const ticketObj = populated.toObject();
    ticketObj.status = "in-progress";
    ticketObj.servingDepartment = ticketObj.subProblem?.problem?.department;

    res.status(StatusCodes.OK).json({
      success: true,
      data: serializeTicket(ticketObj, req.user.role),
      message: "Work started — ticket is now in progress",
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Error starting ticket",
      error: error.message,
    });
  }
}

export async function supervisorStartTicket(req, res) {
  try {
    const { ticketId } = req.body;
    const supervisorId = req.user._id;

    const ticket = await ticketModel.findById(ticketId).populate({
      path: "subProblem",
      select: "name problem",
      populate: { path: "problem", select: "department" },
    });

    if (!ticket) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Ticket not found" });
    }

    const servingId = ticket.subProblem?.problem?.department?._id?.toString() || ticket.subProblem?.problem?.department?.toString();
    if (req.user.role !== "supervisor" || servingId !== req.user.department?.toString()) {
      return res.status(StatusCodes.FORBIDDEN).json({ success: false, message: "Forbidden" });
    }

    const oldStatus = await getTicketStatus(ticket._id);
    const canStart = ["received", "seen", "seen-supervisor"].includes(oldStatus);
    if (!canStart) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Ticket cannot be started in its current status",
      });
    }

    ticket.assignedAgent = supervisorId;
    ticket.supervisor = supervisorId;
    ticket.needsSupervisorReassign = false;
    await ticket.save();

    await recordHistory({
      ticketId: ticket._id,
      action: "assigned",
      user: supervisorId,
      fromStatus: oldStatus,
      toStatus: "dispatched",
      agent: supervisorId,
      note: "Supervisor started working directly",
    });

    const populated = await getPopulatedTicket(ticket._id);
    const ticketObj = populated.toObject();
    ticketObj.status = "dispatched";
    ticketObj.servingDepartment = ticketObj.subProblem?.problem?.department;

    res.status(StatusCodes.OK).json({
      success: true,
      data: serializeTicket(ticketObj, req.user.role),
      message: "You are now assigned to this ticket",
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Error starting ticket",
      error: error.message,
    });
  }
}
