import { body,checkExact } from 'express-validator';
import mongoose from 'mongoose';

export const onBoardOrganizationValidator = [
	// --- Organization fields ---
	body('organizationName')
		.bail()
		.isString().withMessage('Organization name must be a string')
		.notEmpty().withMessage('Organization name is required'),

	body('orgType')
		.bail()
		.isString().withMessage('Organization type must be a string')
		.notEmpty().withMessage('Organization type is required'),

	body('orgEmail')
		.bail()
		.isEmail().withMessage('Valid organization email is required'),

	body('orgContact')
		.bail()
		.isNumeric().withMessage('Organization contact must be a number'),

	body('orgAddress')
		.bail()
		.isString().withMessage('Organization address must be a string')
		.notEmpty().withMessage('Organization address is required'),

	body('city')
		.bail()
		.isString().withMessage('City must be a string')
		.notEmpty().withMessage('City is required'),

	body('state')
		.bail()
		.isString().withMessage('State must be a string')
		.notEmpty().withMessage('State is required'),

	body('country')
		.bail()
		.isString().withMessage('Country must be a string')
		.notEmpty().withMessage('Country is required'),

	body('zipCode')
		.bail()
		.isString().withMessage('Zip Code must be a string')
		.notEmpty().withMessage('Zip Code is required'),

	body('industryType')
		.optional()
		.custom(value => {
			if (!mongoose.Types.ObjectId.isValid(value)) {
				throw new Error('Invalid Industry Type ID');
			}
			return true;
		}),

	body('departments')
		.optional()
		.isArray().withMessage('Departments must be an array')
		.custom((arr) => {
			arr.forEach((id: string | number | mongoose.mongo.BSON.ObjectId | mongoose.mongo.BSON.ObjectIdLike | Uint8Array<ArrayBufferLike>) => {
				if (!mongoose.Types.ObjectId.isValid(id)) {
					throw new Error('Each Department ID must be a valid MongoDB ObjectId');
				}
			});
			return true;
		}),

	body('marketingChannel')
		.bail()
		.isString().withMessage('Marketing channel must be a string')
		.notEmpty().withMessage('Marketing channel is required'),

	body('taxId')
		.optional()
		.bail()
		.isString().withMessage('Tax ID must be a string'),

	// --- ID Proof ---
	body('idProof.idType')
		.optional()
		.isString().withMessage('ID type must be a string'),

	body('idProof.idNumber')
		.optional()
		.isString().withMessage('ID number must be a string'),

	body('idProof.issuingAuthority')
		.optional()
		.isString().withMessage('Issuing authority must be a string'),

	body('idProof.uploadIdProof')
		.optional()
		.isString().withMessage('Upload ID proof must be a string'),

	// --- Plan Commitment ---
	body('planCommitment.planName')
		.optional()
		.isString().withMessage('Plan name must be a string'),

	body('planCommitment.planDuration')
		.optional()
		.isString().withMessage('Plan duration must be a string'),

	body('planCommitment.noOfAgent')
		.optional()
		.isInt({ min: 1 }).withMessage('Number of agents must be a positive integer'),

	body('hasCompletedDetails')
		.optional()
		.isBoolean().withMessage('hasCompletedDetails must be a boolean'),

	body('paymentId')
		.optional()
		.custom(value => {
			if (!mongoose.Types.ObjectId.isValid(value)) {
				throw new Error('Payment ID must be a valid MongoDB ObjectId');
			}
			return true;
		}),

	// --- User fields ---
	body('fullName')
		.bail()
		.isString().withMessage('Full name must be a string')
		.notEmpty().withMessage('Full name is required'),
	body('department')
		.bail()
		.isString().withMessage('department must be a string'),

	body('designation')
		.bail()
		.isString().withMessage('designation must be a string'),
			
	body('email')
		.bail()
		.isEmail().withMessage('Valid user email is required'),

	body('contact')
		.bail()
		.isNumeric().withMessage('Contact must be a valid number'),

	body('password')
		.bail()
		.isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),

	body('confirmPassword')
		.bail()
		.notEmpty().withMessage('Confirm password is required')
		.custom((value, { req }) => {
			if (value !== req.body.password) {
				throw new Error('Confirm password does not match password');
			}
			return true;
	}),
];



export const sendEmailOTPValidator = checkExact([
	body('email')
		.exists({ checkFalsy: true }).withMessage('Email is required')
		.bail()
		.isEmail().withMessage('Must be a valid email.'),

	body('userName')
		.exists({ checkFalsy: true }).withMessage('User name is required.')
		.bail()
		.isString().withMessage('User name must be a string')
])
export const OTPVerificationValidator = checkExact([
	body('email')
		.exists({ checkFalsy: true }).withMessage('Email is required.')
		.bail()
		.isEmail().withMessage('Must be a valid email'),

	body('otp')
		.exists({ checkFalsy: true }).withMessage('otp is required.')
		.bail()
		.isString().withMessage('User name must be a string')
])

