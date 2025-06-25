import { Router } from 'express'
import { catchError } from '../middleware/catch-error.middleware'
import { authenticate } from '../middleware/authenticate.middleware'
import * as DepartmentController from './department.controller'
import * as DepartmentValidation from './department.validation'
import upload from '../helper/file.handler'

const router = Router()
router.post('/create', authenticate, DepartmentValidation.createDepartmentValidation, catchError, DepartmentController.createDepartment)
router.get('/list', authenticate, catchError, DepartmentController.getDepartment)
router.get('/download-template', authenticate, catchError, DepartmentController.downloadDepartmentTemplate)
router.post('/bulk-create', authenticate, DepartmentValidation.bulkCreate, upload.single('file'), DepartmentController.createBulkDepartment)
router.get('/getDepartmentById/:id', authenticate, catchError, DepartmentController.getDepartmentById)
router.put('/update/:id', authenticate, DepartmentValidation.updateDepartmentTypeValidation, catchError, DepartmentController.updateDepartment)
router.patch('/toggleStatus/:id',authenticate,catchError,DepartmentController.toggleDepartmentStatus)
router.delete('/delete:id', authenticate, catchError, DepartmentController.deleteDepartment)

export const DepartmentRouter = router