import { Router } from "express";
import {
  createProblem,
  getProblemsByDepartment,
  getAllProblems,
  createSubProblem,
  getSubProblemsByProblem,
  deleteProblem,
  deleteSubProblem,
} from "../handlers/problem.js";
import { checkAuth } from "../middlewares/auth.js";
import { authorize } from "../middlewares/roles.js";
import { blockSuperadminMutation } from "../middlewares/superadminReadOnly.js";

const problemRouter = Router();

problemRouter.use(checkAuth);
problemRouter.use(blockSuperadminMutation);

// Admin only management
problemRouter.post("/problem", authorize("admin"), createProblem);
problemRouter.delete("/problem/:id", authorize("admin"), deleteProblem);
problemRouter.post("/subproblem", authorize("admin"), createSubProblem);
problemRouter.delete("/subproblem/:id", authorize("admin"), deleteSubProblem);

// Public (authenticated) retrieval
problemRouter.get("/all", getAllProblems);
problemRouter.get("/department/:departmentId", getProblemsByDepartment);
problemRouter.get("/problem/:problemId", getSubProblemsByProblem);

export default problemRouter;
