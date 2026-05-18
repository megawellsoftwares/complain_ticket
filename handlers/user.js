import userModel from "../models/users.js";
import ticketModel from "../models/ticket.js";
import ticketHistoryModel from "../models/ticketHistory.js";
import { StatusCodes } from "http-status-codes";
import { generatePassword, sendAccountCredentials } from "../services/email.js";

async function provisionUser({ firstName, lastName, userName, email, password, role, department, phone, anyDesk }) {
  const plainPassword = password || generatePassword();
  const user = await userModel.create({
    firstName,
    lastName,
    userName,
    email,
    password: plainPassword,
    role,
    department: department || null,
    phone: phone?.replace(/\D/g, "") || phone,
    anyDesk: anyDesk?.trim() || undefined,
    isActive: true,
  });

  const emailResult = await sendAccountCredentials({
    email: user.email,
    userName: user.userName,
    password: plainPassword,
    role: user.role,
    anyDesk: user.anyDesk,
  });

  user.password = undefined;
  return { user, emailResult, generatedPassword: password ? null : plainPassword };
}

export const createUser = async (req, res) => {
  const { firstName, lastName, userName, email, password, role, department, phone, anyDesk } = req.body;
  try {
    const { user, emailResult } = await provisionUser({
      firstName,
      lastName,
      userName,
      email,
      password,
      role: role || "requester",
      department,
      phone,
      anyDesk,
    });
    res.status(StatusCodes.CREATED).json({
      success: true,
      data: user,
      emailSent: emailResult.sent,
      message: emailResult.sent
        ? "User created and credentials emailed successfully!"
        : "User created. Email was not sent (SMTP not configured).",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Username, Email or Phone already exists." });
    }
    res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: error.message });
  }
};

export const createRequester = async (req, res) => {
  const { firstName, lastName, userName, email, password, phone, anyDesk } = req.body;
  try {
    if (!req.user.department) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Responsible user must have a department assigned",
      });
    }
    const { user, emailResult } = await provisionUser({
      firstName,
      lastName,
      userName,
      email,
      password,
      role: "requester",
      department: req.user.department,
      phone,
      anyDesk,
    });
    res.status(StatusCodes.CREATED).json({
      success: true,
      data: user,
      emailSent: emailResult.sent,
      message: emailResult.sent
        ? "Requester created and credentials emailed successfully!"
        : "Requester created. Email was not sent (SMTP not configured).",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Username, Email or Phone already exists." });
    }
    res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: error.message });
  }
};

export const createAgent = async (req, res) => {
  const { firstName, lastName, userName, email, password, phone, anyDesk } = req.body;
  try {
    if (!req.user.department) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Supervisor must have a department assigned",
      });
    }
    const { user, emailResult } = await provisionUser({
      firstName,
      lastName,
      userName,
      email,
      password,
      role: "agent",
      department: req.user.department,
      phone,
      anyDesk,
    });
    res.status(StatusCodes.CREATED).json({
      success: true,
      data: user,
      emailSent: emailResult.sent,
      message: emailResult.sent
        ? "Agent created and credentials emailed successfully!"
        : "Agent created. Email was not sent (SMTP not configured).",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Username, Email or Phone already exists." });
    }
    res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: error.message });
  }
};

// GET /admin/
export const getAllUsers = async (req, res) => {
  const users = await userModel.find({}).select('-password').populate("department", "name");
  res.json(users);
};

export const getDepartmentRequesters = async (req, res) => {
  try {
    if (!req.user.department) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Responsible user must have a department assigned",
      });
    }
    const users = await userModel
      .find({ department: req.user.department, role: "requester" })
      .select("-password")
      .populate("department", "name")
      .sort({ userName: 1 });
    res.status(StatusCodes.OK).json({ success: true, data: users });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAgentProfile = async (req, res) => {
  try {
    const agent = await userModel
      .findById(req.params.agentId)
      .select("-password")
      .populate("department", "name");

    if (!agent || agent.role !== "agent") {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Agent not found" });
    }

    if (req.user.role === "supervisor") {
      const same =
        agent.department?._id?.toString() === req.user.department?.toString() ||
        agent.department?.toString() === req.user.department?.toString();
      if (!same) {
        return res.status(StatusCodes.FORBIDDEN).json({ success: false, message: "Forbidden" });
      }
    }

    const stats = await ticketModel.aggregate([
      { $match: { assignedAgent: agent._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Average Resolution Time for this specific agent
    const history = await ticketHistoryModel.aggregate([
      { $match: { agent: agent._id, action: { $in: ["accepted", "resolved"] } } },
      { $sort: { ticket: 1, createdAt: 1 } },
      {
        $group: {
          _id: "$ticket",
          acceptedAt: { $min: "$createdAt" },
          resolvedAt: { $max: "$createdAt" },
          actions: { $push: "$action" }
        }
      },
      { $match: { actions: { $all: ["accepted", "resolved"] } } },
      { $project: { duration: { $subtract: ["$resolvedAt", "$acceptedAt"] } } },
      { $group: { _id: null, avgMs: { $avg: "$duration" }, count: { $sum: 1 } } }
    ]);

    // "Couldn't resolve" count (escalated by this agent)
    const escalatedCount = await ticketHistoryModel.countDocuments({
      agent: agent._id,
      action: "escalated"
    });

    const resolvedCount = stats.find(s => s._id === "resolved")?.count || 0;
    const closedCount = stats.find(s => s._id === "closed")?.count || 0;

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        agent,
        ticketsByStatus: stats,
        performance: {
          resolvedTotal: resolvedCount + closedCount,
          avgTimeHrs: history[0] ? (history[0].avgMs / (1000 * 60 * 60)) : 0,
          escalatedCount
        }
      },
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllAgents = async (req, res) => {
  try {
    const filter = { role: 'agent' };

    // If supervisor, only show agents from their department
    if (req.user.role === 'supervisor') {
      filter.department = req.user.department;
    } else if (req.query.department) {
      // Allow admins to filter by department via query param
      filter.department = req.query.department;
    }

    const agents = await userModel.find(filter).select('-password').populate('department', 'name');
    res.status(StatusCodes.OK).json({
      success: true,
      data: agents
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Failed to fetch agents",
      error: error.message
    });
  }
};
// for user
export const getUserDetails = async (req, res) => {
  const user = await userModel.findById(req.user.id).select('-password').populate("department", "name");
  res.json(user);
};

//for admin
export const getUserDetailsbyAdmin = async (req, res) => {
  const user = await userModel.findById(req.params.id).select('-password').populate("department", "name");
  res.json(user);
};


export const updateUser = async (req, res) => {
  const { firstName, lastName, userName, phone, password } = req.body;

  try {
    const user = await userModel.findById(req.user._id || req.user.id);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (userName) user.userName = userName;
    if (phone) user.phone = phone;
    if (password) user.password = password; // Will be hashed by pre-save hook

    await user.save();
    user.password = undefined;

    res.status(StatusCodes.OK).json({
      success: true,
      data: user,
      message: "Profile updated successfully!",
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Update failed",
      error: error.message,
    });
  }
};


// PATCH /admin/role/:id
// export const updateUserRole = async (req, res) => {
//     const {role, department}= req.body;
//     const user = await userModel.findById(req.params.id);
//     if (user) {
//         user.role = role;
//         user.department = department || user.department; // e.g., 'admin' or 'user'
//         await user.save();
//         res.json({ message: `User role updated to ${user.role}` });
//     } else {
//         res.status(404).json({ message: "User not found" });
//     }
// };

export const updateUserRole = async (req, res) => {
  const { role, department, isActive } = req.body;
  const { id } = req.params;

  try {
    const user = await userModel.findById(id);

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "User not found"
      });
    }

    // Update the fields
    if (role) user.role = role;
    if (department !== undefined) user.department = department || null;
    if (typeof isActive === "boolean") user.isActive = isActive;

    await user.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: `User ${user.userName} updated successfully!`,
      data: user
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Update failed. Ensure 'department' is a valid ObjectId, not a string name.",
      error: error?.message || error,
    });
  }
};

// DELETE /admin/:id
export const deleteUser = async (req, res) => {
  const user = await userModel.findById(req.params.id);
  if (user) {
    await user.deleteOne();
    res.json({ message: "User removed from system" });
  } else {
    res.status(404).json({ message: "User not found" });
  }
};