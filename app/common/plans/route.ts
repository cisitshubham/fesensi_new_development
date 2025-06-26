import { Router } from 'express'
import { catchError } from '../../common/middleware/catch-error.middleware'
import { authenticate } from '../../common/middleware/authenticate.middleware'
import * as planController from './plans.controller'
import * as planValidation from './plans.validation'
import upload from '../helper/file.handler'
const router = Router()
router.get('/get/plans/duration', planController.plansDuration)
router.get('/get/plans', planController.getPlans)
router.get('/get/plans/:id', planController.getPlanById)
router.post('/create', authenticate,upload.none(),planValidation.createPlanValidation,catchError, planController.createPlan)
router.put('/update/:id', authenticate,upload.none(),planValidation.updatePlanValidation, catchError, planController.updatePlan)
router.patch('/togglePlanStatus/:id', authenticate, catchError, planController.togglePlanStatus)
router.get('/list',catchError,planController.getPlanForApp)
export const plansRouter = router
