import { StatusCodes } from "http-status-codes";
import problemModel from "../models/problem.js";
import subProblemModel from "../models/subProblem.js";

function lowTierFilter() {
  return {};
}

// Problems
export async function createProblem(req, res) {
  try {
    const { name, department, tier } = req.body;
    const problem = await problemModel.create({
      name,
      department,
      tier: tier === "high" ? "high" : "low",
    });
    res.status(StatusCodes.CREATED).json({ success: true, data: problem });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: error.message });
  }
}

export async function getProblemsByDepartment(req, res) {
  try {
    const { departmentId } = req.params;
    const filter = { department: departmentId, ...lowTierFilter(req.user.role) };
    const problems = await problemModel.find(filter);
    res.status(StatusCodes.OK).json({ success: true, data: problems });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: error.message });
  }
}

export async function getAllProblems(req, res) {
  try {
    const filter = lowTierFilter();
    const problems = await problemModel.find(filter).populate("department", "name");
    res.status(StatusCodes.OK).json({ success: true, data: problems });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: error.message });
  }
}

// SubProblems
export async function createSubProblem(req, res) {
  try {
    const { name, problem } = req.body;
    const subProblem = await subProblemModel.create({ name, problem });
    res.status(StatusCodes.CREATED).json({ success: true, data: subProblem });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: error.message });
  }
}

export async function getSubProblemsByProblem(req, res) {
  try {
    const { problemId } = req.params;
    const parent = await problemModel.findById(problemId);
    if (!parent) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Problem not found" });
    }
    const subProblems = await subProblemModel.find({ problem: problemId });
    res.status(StatusCodes.OK).json({ success: true, data: subProblems });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: error.message });
  }
}

export async function deleteProblem(req, res) {
  try {
    await problemModel.findByIdAndDelete(req.params.id);
    res.status(StatusCodes.OK).json({ success: true, message: "Problem deleted" });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: error.message });
  }
}

export async function deleteSubProblem(req, res) {
  try {
    await subProblemModel.findByIdAndDelete(req.params.id);
    res.status(StatusCodes.OK).json({ success: true, message: "Sub-problem deleted" });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: error.message });
  }
}
