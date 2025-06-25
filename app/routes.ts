import asyncHandler from 'express-async-handler';
import express, {Request ,Response,NextFunction} from 'express'
import userRoutes from './user/user.route'
import ticketRoutes from './ticket/ticket.route'
import statusRoutes from './admin/status/status.route'
import {adminRoutes} from './admin/adminRoutes'
import {agentRoutes} from './agent/agent.route'
import {authorizeRoles} from './common/middleware/verifyRole.middleware'
import { authenticate } from './common/middleware/authenticate.middleware'
import {extractRoutes} from './common/roles_permission/getAllroute'
import {checkPermission} from './common/middleware/isPermission.middleware'
import {plansRouter} from './common/plans/route'
import {IndustryTypeRoute } from './common/indusrtyType/route'
import {DepartmentRouter } from './common/departments/route'
import {oraganizationOnboard } from './common/organization/route'



const router = express.Router()
router.use('/admin', authenticate,authorizeRoles('67f36e1c62102e130bb86c38'),adminRoutes)
router.use('/agent', authenticate, authorizeRoles('67f36e1462102e130bb86c35'),agentRoutes)
router.use('/tickets', authenticate,ticketRoutes, statusRoutes)

router.use('/plans',plansRouter)
router.use('/users',userRoutes)
router.use('/industryType',IndustryTypeRoute)
router.use('/department',DepartmentRouter)
router.use('/organization',oraganizationOnboard)

router.use((req: Request, res: Response, next: NextFunction) => {
	res.status(404).json({ success: false, message: 'Route not found' });
});


extractRoutes(router)
export default router
