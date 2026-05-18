import { StatusCodes } from "http-status-codes";
import ticketModel from "../models/ticket.js";
import ticketHistoryModel from "../models/ticketHistory.js";
import userModel from "../models/users.js";
import departmentModel from "../models/department.js";

export async function getGeneralStats(req, res) {
  try {
    const totalTickets = await ticketModel.countDocuments();
    const totalUsers = await userModel.countDocuments();
    const totalDepts = await departmentModel.countDocuments();

    // Tickets by Status
    const allTickets = await ticketModel.find().populate({
      path: "subProblem",
      populate: { path: "problem", select: "department" }
    });

    const ticketHistories = await ticketHistoryModel.aggregate([
      { $sort: { ticket: 1, createdAt: -1 } },
      { $group: { _id: "$ticket", lastStatus: { $first: "$toStatus" } } }
    ]);

    const statusCount = {};
    const deptCount = {};

    for (const ticket of allTickets) {
      const history = ticketHistories.find(h => h._id.toString() === ticket._id.toString());
      const status = history ? history.lastStatus : "received";
      statusCount[status] = (statusCount[status] || 0) + 1;

      const deptId = ticket.subProblem?.problem?.department?.toString();
      if (deptId) {
        deptCount[deptId] = (deptCount[deptId] || 0) + 1;
      }
    }

    const statusStats = Object.keys(statusCount).map(k => ({ _id: k, count: statusCount[k] }));

    const deptList = await departmentModel.find();
    const ticketsByDept = Object.keys(deptCount).map(k => {
      const dept = deptList.find(d => d._id.toString() === k);
      return { name: dept ? dept.name : "Unknown", count: deptCount[k] };
    }).sort((a, b) => b.count - a.count);

    // Users by Role
    const usersByRole = await userModel.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);

    // Agent performance details
    const agentPerformance = await ticketHistoryModel.aggregate([
      { $match: { action: { $in: ["accepted", "resolved"] } } },
      { $sort: { ticket: 1, createdAt: 1 } },
      { $group: { 
          _id: "$ticket", 
          agent: { $first: "$user" },
          acceptedAt: { $min: "$createdAt" },
          resolvedAt: { $max: "$createdAt" },
          actions: { $push: "$action" }
      }},
      { $match: { actions: { $all: ["accepted", "resolved"] } } },
      { $project: { 
          agent: 1, 
          duration: { $subtract: ["$resolvedAt", "$acceptedAt"] } 
      }},
      { $group: { 
          _id: "$agent", 
          avgTimeMs: { $avg: "$duration" }, 
          resolvedCount: { $sum: 1 } 
      }},
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "userObj" } },
      { $unwind: "$userObj" },
      { $project: { 
          name: "$userObj.userName", 
          resolvedCount: 1, 
          avgTimeHrs: { $divide: ["$avgTimeMs", 1000 * 60 * 60] } 
      }},
      { $sort: { resolvedCount: -1 } }
    ]);

    // Top Sub-problems
    const topSubProblems = await ticketModel.aggregate([
      { $group: { _id: "$subProblem", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: "subproblems", localField: "_id", foreignField: "_id", as: "sp" } },
      { $unwind: "$sp" },
      { $project: { name: "$sp.name", count: 1 } }
    ]);

    // Escalated counts per agent
    const escalatedStats = await ticketHistoryModel.aggregate([
      { $match: { action: "escalated" } },
      { $group: { _id: "$agent", count: { $sum: 1 } } }
    ]);

    const finalAgentPerformance = agentPerformance.map(ap => {
      const esc = escalatedStats.find(e => e._id?.toString() === ap._id?.toString());
      return { ...ap, escalatedCount: esc ? esc.count : 0 };
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        totals: {
          tickets: totalTickets,
          users: totalUsers,
          departments: totalDepts
        },
        topDept: ticketsByDept.length > 0 ? ticketsByDept[0] : null,
        avgResolutionTimeHrs: finalAgentPerformance.length > 0 ? 
          (finalAgentPerformance.reduce((acc, curr) => acc + curr.avgTimeHrs, 0) / finalAgentPerformance.length).toFixed(1) : 0,
        statusStats,
        ticketsByDept,
        usersByRole,
        agentStats: finalAgentPerformance.map(ap => ({
          name: ap.name,
          count: ap.resolvedCount,
          escalated: ap.escalatedCount,
          avgHrs: ap.avgTimeHrs.toFixed(1)
        })),
        topSubProblems
      }
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error fetching statistics",
      error: error.message
    });
  }
}
