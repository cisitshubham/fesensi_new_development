import { Router } from 'express'
import { catchError } from '../../common/middleware/catch-error.middleware'
import { authenticate } from '../../common/middleware/authenticate.middleware'
import * as onBoardOrganizationController from './organiztion.controller'
import * as onBoardOrganizationValidation from './organization.validation'
import upload from '../helper/file.handler'

const router =Router(); 
router.post('/onboard/organization', authenticate,upload.none(), onBoardOrganizationValidation.onBoardOrganizationValidator,catchError,onBoardOrganizationController.onBoardOrganizationController)
router.post('/send/email/otp', onBoardOrganizationValidation.sendEmailOTPValidator, catchError, onBoardOrganizationController.sendEmailOTP);
router.post('/verify/email/otp',onBoardOrganizationValidation.OTPVerificationValidator,catchError,onBoardOrganizationController.verifyEmailOTP);

export const oraganizationOnboard = router