import { Router } from 'express'
import { catchError } from '../../common/middleware/catch-error.middleware'
import { authenticate } from '../../common/middleware/authenticate.middleware'
import * as IndustryTypeController from './industryType.controller'
import * as IndustryTypeValidation from './industryType.validation'
import upload from '../helper/file.handler'

const router = Router()
router.post('/create', authenticate, IndustryTypeValidation.createIndustryTypeValidation, catchError, IndustryTypeController.createIndustryType)
router.get('/list', authenticate, catchError, IndustryTypeController.getIndustryTypes)
router.get('/download-template', authenticate, catchError, IndustryTypeController.downloadIndustryTypesTemplate)
router.post('/bulk-create', authenticate, IndustryTypeValidation.bulkCreate, upload.single('file'), IndustryTypeController.createBulkIndustryType)
router.get('/getIndustryById/:id', authenticate, catchError, IndustryTypeController.getIndustryTypeById)
router.put('/update/:id', authenticate, IndustryTypeValidation.updateIndustryTypeValidation, catchError, IndustryTypeController.updateIndustryType)
router.patch('/toggleStatus/:id',authenticate,catchError,IndustryTypeController.toggleIndustryTypeStatus)
router.delete('/delete:id', authenticate, catchError, IndustryTypeController.deleteIndustryType)

export const IndustryTypeRoute = router