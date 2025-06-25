import { Router } from 'express'
import { catchError } from '../common/middleware/catch-error.middleware'
import * as userController from './user.controller'
import * as userValidator from './user.validation'
import { authenticate } from '../common/middleware/authenticate.middleware'
import { isUserActive } from '../common/middleware/isUserActive.middleware'
import uploade from '../common/helper/file.handler';
import { setUploadFolder } from '../common/middleware/setupload.dir'

const router = Router()

router
    .post('/signup',userValidator.createUser,catchError,userController.createUser)
	.post('/login', userValidator.login, catchError, isUserActive, userController.login)
    .get('/me', authenticate, userController.getCurrentUser)
    .get('/:email', authenticate, userController.getUserByEmail)
    .get('/id/:id', authenticate, userController.getUserById)		
	.get('/verify/:token', userController.IsUserVerify)
	.get('/veryfiy/role', authenticate,userController.VerifyRole)
	.post('/forget-password', userValidator.forgetPassword, catchError ,isUserActive, userController.forgetPassword)
	.post('/reset-password',uploade.none(), userValidator.resetPassword,catchError ,userController.resetPassword)
	.post('/update-profile', authenticate, setUploadFolder("profile"), uploade.single('image'), catchError, userController.profileUpdate)
	.get('/assign/users', authenticate, catchError, userController.AdminUsers)
	.post('/logout', authenticate, catchError, userController.logout)
	.post('/verifyToken', authenticate, catchError, userController.verifyToken)
	.post('/pushNotification', authenticate,userController.getPushNotification)
	.post('/delete/pushNotification/:fcmId', authenticate, catchError, userController.deletePushNotificationById)
	.get('/deleteAll/pushNotification', authenticate, catchError, userController.deleteUserAllnotification)
	
export default router
