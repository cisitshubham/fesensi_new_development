import { Router } from 'express'
import { catchError } from '../../common/middleware/catch-error.middleware'
import { authenticate } from '../../common/middleware/authenticate.middleware'
import { isUserActive } from '../../common/middleware/isUserActive.middleware'
import uploade from '../../common/helper/file.handler';
import { setUploadFolder } from '../../common/middleware/setupload.dir'
import*as StatusController from './status.controller'

const router = Router()
router
	.post('/status/create', authenticate, catchError, StatusController.createStatus)
	.get('/status/getAllstatus', authenticate, catchError, StatusController.getAllStatus)	

export default router
