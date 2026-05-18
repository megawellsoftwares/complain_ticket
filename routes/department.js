import { Router } from 'express';
import { createDepartment, deleteDepartment, getDepartments, updateDepartment } from '../handlers/department.js';
import { checkAuth } from '../middlewares/auth.js';
import { authorize } from '../middlewares/roles.js';
import { blockSuperadminMutation } from '../middlewares/superadminReadOnly.js';

const departmentRouter = Router();


departmentRouter.get('/', getDepartments);
departmentRouter.use(checkAuth);
departmentRouter.use(blockSuperadminMutation);
// Admin only routes
departmentRouter.post('/', authorize('admin'), createDepartment);
departmentRouter.put('/:id', authorize('admin'), updateDepartment);
departmentRouter.delete('/:id', authorize('admin'), deleteDepartment);



export default departmentRouter;