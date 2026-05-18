import { Router } from "express";
import * as user from "../handlers/user.js";
import { checkAuth } from "../middlewares/auth.js";
import { authorize } from "../middlewares/roles.js";
import { blockSuperadminMutation } from "../middlewares/superadminReadOnly.js";

const userRouter = Router();

userRouter.use(checkAuth);
userRouter.use(blockSuperadminMutation);

userRouter.get("/me", user.getUserDetails);
userRouter.put("/", user.updateUser);

userRouter.get("/agents", authorize("supervisor", "admin", "superadmin"), user.getAllAgents);
userRouter.get("/agents/:agentId/profile", authorize("supervisor", "admin", "superadmin"), user.getAgentProfile);
userRouter.get("/department/requesters", authorize("responsible"), user.getDepartmentRequesters);
userRouter.post("/department/requesters", authorize("responsible"), user.createRequester);
userRouter.post("/agents", authorize("supervisor"), user.createAgent);

userRouter.get("/", authorize("admin", "superadmin"), user.getAllUsers);
userRouter.post("/", authorize("admin"), user.createUser);
userRouter.get("/:id", authorize("admin", "superadmin"), user.getUserDetailsbyAdmin);
userRouter.put("/user-role/:id", authorize("admin"), user.updateUserRole);
userRouter.delete("/:id", authorize("admin"), user.deleteUser);

export default userRouter;
