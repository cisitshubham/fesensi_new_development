import { Request, Response } from 'express';
import { IOrganization } from '../models/organization.model';
import { createResponse, createErrorResponse, createEmptyResponse, } from '../helper/response.helper'
import asyncHandler from 'express-async-handler'
import * as organizationService from './organization.service';
import * as userService from '../../user/user.service'
import { emailVerificationOTPMail } from '../../mail/mail.templates';
import { sendMail } from '../../common/services/mail.service'
import { v4 as uuidv4 } from 'uuid';
import {calculatePlanCost} from '../helper/PlanCostCalculator'


const emailOTPCache = new Map<string, {
	otp: string;
	data: any;
	expiresAt: number;
}>();

// Send OTP
export const sendEmailOTP = asyncHandler(async (req: Request, res: Response) => {
	const { email,userName } = req.body;
	if (!email || !userName) {
		 res.status(400).json({ message: 'Email and userName are required' });
		return
	}
	const otp = Math.floor(1000 + Math.random() * 9000).toString();
	const expiresAt = Date.now() + 10 * 60 * 1000; 
	emailOTPCache.set(email, { otp, data: req.body, expiresAt });
	const mail = emailVerificationOTPMail(userName, otp);
	const result = await sendMail(email,"Welcome to FESENSI – Email Verification",mail);
	res.status(200).json({ message: 'OTP sent to email' });
});

// Verify OTP and save
export const verifyEmailOTP = asyncHandler(async (req: Request, res: Response) => {
	const { email, otp } = req.body;
	const record = emailOTPCache.get(email);
	if (!record) {
		res.status(400).json(createErrorResponse(400,'OTP expired or invalid'));
		return
	}
	if (Date.now() > record.expiresAt) {
		emailOTPCache.delete(email);
		res.status(400).json(createErrorResponse(400,'OTP expired'));
		return
	}
	if (record.otp !== otp) {
		res.status(400).json(createErrorResponse(400,'Incorrect OTP'));
		return
	}
	emailOTPCache.delete(email);
	res.status(200).json({ message: 'Email verified Successfully.' });
});

export const onBoardOrganizationController = asyncHandler(async (req: Request, res: Response) => {
	const data: IOrganization = req.body;

	// Extract email domain
	const domain = req.body.orgEmail?.split('@')[1]?.toLowerCase();
	const website = req.body.orgWebsite?.toLowerCase();
	const websiteDomain = website?.replace(/(^\w+:|^)\/\//, '').split('/')[0].replace(/^www\./, '');

	if (domain !== websiteDomain) {
		res.status(400).json(createErrorResponse(400, 'Email domain and website domain do not match.'));
		return
	}

	const userEmailDomain = req.body.email?.split('@')[1]?.toLowerCase();
	if (userEmailDomain !== domain && userEmailDomain !== websiteDomain) {
		res.status(400).json(createErrorResponse(400, 'Your email is not associated with the organization.'));
		return
	}

	const existingOrg = await organizationService.GetOrganizationByEmail(req.body.orgEmail);
	if(existingOrg){
		res.status(400).json({ message: 'Organization already exists with this email.' });
		return;
	}
	const existingOrgContact = await organizationService.getOrganizationByContact(req.body.orgContact);
	if (existingOrgContact){
		res.status(400).json({ message: 'Organization already exists with this phone number.' });
		return;
	}
	
	const result = await organizationService.onBoardOrganization(data);
	if (!result) {
		res.status(400).json(createErrorResponse(400, 'Failed to onboard organization'));;
		return;
	}
	
	const userData = {
		first_name: req.body.fullName,
		email: req.body.email,
		contact: req.body.contact,
		orgId: result._id as string,
		password: req.body.password,
		department: req.body.department,
		designation: req.body.designation
	}

	const existingUser = await userService.getUserByEmail(req.body.email);
	if (existingUser) {
		res.status(400).send(createErrorResponse(400, "User already exists!"));
		return;
	}

	const userResult = await userService.createUser(userData)
		if(!result){
			res.status(400).send(createErrorResponse(400, "User not created"));
			return;
		}
		
	   if (userResult.metrics) {
			const metrics = userResult.metrics as Record<string, number>;
				Object.keys(metrics).forEach(key => {
					if (typeof metrics[key] === 'number') {
						metrics[key] = Number(metrics[key].toFixed(2));
					}
				});
			}
		if (typeof userResult.trustScore === 'number') {
			userResult.trustScore = Number(userResult.trustScore.toFixed(2));
		}
		result.accountDetails = userResult;
	
	
	res.status(200).json(createResponse(result, 'Organization onboarded successfully'));
	return;
});

export const PlanCostCalculator = asyncHandler(async (req: Request, res: Response) => {

})