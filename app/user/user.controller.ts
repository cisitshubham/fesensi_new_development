import { Request, Response } from 'express'
import { createResponse, createErrorResponse, createEmptyResponse, createErrorPaginationResponse } from '../common/helper/response.helper'
import asyncHandler from 'express-async-handler'
import * as userService from './user.service'
import jwt from 'jsonwebtoken'
import { createUserTokens ,destroyToken } from '../common/services/passport-jwt.service'
import passport from 'passport'
import { IUser } from './user.dto'
import { sendMail } from '../common/services/mail.service'
import dotenv from 'dotenv'
import * as sendNotification from '../common/services/firebase.service';
import {createUserFcm,getFcmTokenById} from '../common/services/fcmUser.service';
import {createPushNotification,deletePushNotification,getAllPushNotifications,deleteAllPushNotifications  } from '../common/services/push-notification.service';
import { welcomeMail , passwordResetMail } from '../mail/mail.templates';
import { formatTime } from '../common/helper/formatTIme'
dotenv.config()

export const createUser = asyncHandler(async (req: Request, res: Response) => {
	req.body.email = req.body.email?.toLowerCase(); 
	req.body.profile_img = `${process.env.APP_URL}/images/images/default_profile.jpg`;
	const existingUser = await userService.getUserByEmail(req.body.email);
	if(existingUser){
		res.status(400).send(createErrorResponse(400, "User already exists!"));
		return;
	}

	const result = await userService.createUser(req.body)
	if(!result){
		res.status(400).send(createErrorResponse(400, "User not created"));
		return;
	}

	// Format metrics as floats
	if (result.metrics) {
		const metrics = result.metrics as Record<string, number>;
		Object.keys(metrics).forEach(key => {
			if (typeof metrics[key] === 'number') {
				metrics[key] = Number(metrics[key].toFixed(2));
			}
		});
	}
	if (typeof result.trustScore === 'number') {
		result.trustScore = Number(result.trustScore.toFixed(2));
	}

	const userName = result.first_name || result.email;
	const mailContent = welcomeMail(userName, result.email, formatTime(result.createdAt));
	sendMail(result.email, "Welcome to FESENSI – Your Registration is Successful!", mailContent);
	
	// create notification for admin 
	const admin = await userService.getAdminByRole();
	if(admin && admin.length > 0){
		await createPushNotification(admin[0]._id,'','register', 'New user registered');
	}
	res.send(createResponse(result, 'Account created successfully.'))
})

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
	const result = await userService.getUserById(req.params.id)
	if (!result) {
		res.status(404).send(createErrorResponse(400, "User not found"));
		return;
	}
	res.send(createResponse(result))
})



export const getUserByEmail = asyncHandler(
	async (req: Request, res: Response) => {
		const result = await userService.getUserByEmail(req.params.email)
		res.send(createResponse(result))
	}
)

export const login = asyncHandler(async (req: Request, res: Response) => {
	req.body.email = req.body.email?.toLowerCase();
	passport.authenticate('login', { session: false }, async (err: any, user: Omit<IUser, 'password'>, info: any) => {
		if (err) {
			return res.status(400).send(createErrorResponse(400, err.message));
		}
		if (!user) {
			return res.status(401).send(createErrorResponse(401, info?.message || 'Invalid credentials'));
		}
		const FcmToken: string = req.body.fcm_token;		
		if (FcmToken) {
			const fcmToken = await getFcmTokenById(FcmToken); 
			if (!fcmToken) {
				const FCMData = {
					userId: user._id,
					fcmTokens: FcmToken,	
				};			
				let NotiResult=	await sendNotification.sendNotification([FcmToken], 'New Login', 'You have logged in from a new device.');
				if(!NotiResult){
					return res.status(500).send(createErrorResponse(500, 'Failed to send notification'));
				}
				const newFcmToken = await createUserFcm(FCMData);
				if (!newFcmToken) {
					return res.status(500).send(createErrorResponse(500, 'Failed to create FCM token'));
				}
				await createPushNotification((user as any)._id, FcmToken, 'login', 'You have logged in from a new device.');
				const NewFCMID = newFcmToken._id;
				await userService.UpdateUserByID({ _id: user._id, fcm_token: NewFCMID });
			}
		}

		const tokens = createUserTokens(user);
		res.send(createResponse({ user, tokens }, info?.message));
	})(req, res);
});


export const getCurrentUser = asyncHandler(
	async (req: Request, res: Response) => {
		const token = req.headers.authorization?.replace('Bearer ', '')
		// @ts-ignore
		const decodedUser = jwt.verify(token, process.env.JWT_SECRET!) as {
			_id: string
		}
		const user = await userService.getUserById(decodedUser._id)
		// @ts-ignore
		const { password, ...data } = user.toObject()
		res.send(createResponse(data))
	}
)

export const IsUserVerify = asyncHandler(
	async (req: Request, res: Response) => {
		const token = req.params.token;
		const decoded = jwt.verify(token, process.env.JWT_SECRET || "Secret") as { email: string };
		const result = await userService.IsUserVerify(decoded.email);
		if (!result) {
			res.status(404).send(createErrorResponse(400, "User not found"));
			return;
		}
		res.render('pages/email-verified')
	}
);

export const forgetPassword = asyncHandler(
	async (req: Request, res: Response) => {
		const email = req.body.email;
		const OTP = Math.floor(1000 + Math.random() * 9000);
		const result = await userService.getUserByEmail(email);		
		if (!result) {
			res.status(404).send(createErrorResponse(404, "User not found"));
			return;
		}
	
		// Check if there's a recent OTP request within 2 minutes
		if (result.lastOtpRequestTime && 
			(new Date().getTime() - new Date(result.lastOtpRequestTime).getTime()) < 120000) {
			res.status(429).send(createErrorResponse(429, "Please wait 2 minutes before requesting another OTP"));
			return;
		}

		await userService.forgetPassword(email, OTP);
		const mailContent = passwordResetMail(result.first_name, OTP);
		await sendMail(email, "FESENSI – Password Reset OTP", mailContent);
		res.send(createResponse([], 'OTP sent successfully'));
	}
);

export const resetPassword = asyncHandler(
	async (req: Request, res: Response) => {
		const OTP = req.body.otp;
		const Userpassword = req.body.password;
		const result = await userService.resetPassword(OTP, Userpassword);
		if (result == null) {
			res.status(404).send(createErrorResponse(400, "Invalid OTP or User not found"));
			return;
		}
		res.send(createResponse([], 'Password reset successfully'))

	}
);

export const profileUpdate = asyncHandler(
	async (req: Request, res: Response) => {
		let profile_img = req.file?.filename;
		let url = `${process.env.APP_URL}/images/miscellaneous/${profile_img}`
		const user = (req as any).user;
		const userId = user._id
		let result = await userService.profileUpdate(userId, url);
		if (!result) {
			res.status(404).send(createErrorResponse(400, "User not found"));
		}		
		const updatedUser = await userService.getUserById(userId);
		res.send(createResponse(result, 'Profile updated successfully.'));
});

export const AdminUsers = asyncHandler(
	async (req: Request, res: Response) => {
		const result = await userService.getAssinUserByRole();
		if (!result || result.length === 0) {
			res.status(404).send(createErrorResponse(400, "No admin users found"));
			return;
		}
		res.send(createResponse(result, 'Data loaded.'));
})


export const logout = asyncHandler(async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        res.status(400).send(createResponse(null, 'No token provided'));
        return;
    }
    destroyToken(token); 
    res.setHeader("Authorization", "");
    res.send(createResponse(null, 'Logged out successfully'));
});

export const verifyToken = asyncHandler(async (req: Request, res: Response) => {
	const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        res.status(400).send(createErrorResponse(400, 'No token provided'));
        return;
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'Secret');
        res.send(createResponse(decoded, 'Token verified successfully.'));
    } catch (error) {
        res.status(401).send(createErrorResponse(401, 'Invalid token'));
    }
});

export const getPushNotification = asyncHandler(async (req: Request, res: Response) => {
	const user = (req as any).user;
	const userId = user._id
	const result = await getAllPushNotifications(userId);
	if (!result || result.length === 0) {
		res.send(createEmptyResponse());
		return;
	}
	res.send(createResponse(result, 'Data loaded.'));
});


export const deletePushNotificationById = asyncHandler(async (req: Request, res: Response) => {
	const notificationId = req.params.fcmId;
	const result = await deletePushNotification(notificationId);
	if (!result) {
		res.send(createEmptyResponse());
		return;
	}
	res.send(createResponse(result, 'Push notification deleted successfully.'));
});

export const  deleteUserAllnotification = asyncHandler(async (req: Request, res: Response) => {
	const user = (req as any).user;
	const userId = user._id;
	const result = await deleteAllPushNotifications(userId);
	if (result === undefined) {
		res.send(createEmptyResponse());
		return;
	}
	res.send(createResponse(null, 'All push notifications deleted successfully.'));
})

export const VerifyRole = asyncHandler(
	async (req:Request,res:Response) =>{
		let user = (req as any).user;
		let role =user.role;
		let userId= user._id;
		let result = await userService.roleVerify(userId);
		res.send(createResponse(result, 'Role verified successfully.'));
	}
)

