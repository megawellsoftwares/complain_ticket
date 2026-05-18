import { Router } from "express";
import { getGeneralStats } from "../handlers/statistics.js";
import { checkAuth } from "../middlewares/auth.js";
import { authorize } from "../middlewares/roles.js";

const statsRouter = Router();

statsRouter.use(checkAuth);
statsRouter.get("/general", authorize("supervisor", "admin", "superadmin"), getGeneralStats);

export default statsRouter;
