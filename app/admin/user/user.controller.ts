import { Request, Response } from 'express'
import { createResponse, createErrorResponse, createEmptyResponse, } from '../../common/helper/response.helper'
import asyncHandler from 'express-async-handler'
import * as userService from './user.service'
import { sendNotifications } from '../../common/services/push-notification.service'
import { accountActivatedMail } from '../../mail/mail.templates'
import { formatTime } from '../../common/helper/formatTIme'
import { sendMail } from '../../common/services/mail.service'

interface RequestWithImage extends Request {
	image?: {
		filename: string;
	};
}

export const createUser = asyncHandler(async (req: Request, res: Response) => {
	const allowedFields = [
		'first_name',
		'email', 
		'password',
		'role',
		'status',
		'level',
		'categories',
		'priority',
		'profile_img',
		'created_at',
		'updated_at'
	];

	let data: any = {};
	for (const field of allowedFields) {
		let value = req.body?.[field];

		if (field === 'role' || field === 'categories') {
			if (typeof value === 'string') {
				value = value.split(',').map((item: string) => item.trim());
			}
		}
		if (value !== null && value !== undefined) {
			data[field] = value;
		}
	}

	// Set default values
	data.profile_img = `${process.env.APP_URL}/images/images/default_profile.jpg`;
	data.status = true;
	data.level = data.level || 'L1';
	const user = await userService.createUser(data);
	res.status(201).json(createResponse(user));
});

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
	const users = await userService.getAllUsers()
	if (!users || !users.length) {
		res.status(404).json(createErrorResponse(404, 'Data not found'))
		return;
	}
	res.status(200).json(createResponse(users))
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
	const user = await userService.getUserByID(req.params.id)
	if (!user) {
		res.status(404).json(createErrorResponse(404, 'Data not found'))
		return;
	}
	res.status(200).json(createResponse(user))
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
	// let file = req.file?.filename;
	// let url = `${process.env.APP_URL}/images/miscellaneous/${file}`;
	const allowedFields = [
		'first_name',
		'email',
		'password',
		'role',
		// 'department',
		'status',
		'level',
		'categories',
		'priority',
		'profile_img',
		'created_at',
		'updated_at'
	];

	let data: any = { id: req.params.id };
	// req.body.profile_img = url;

	

	for (const field of allowedFields) {
		let value = req.body?.[field];

		if (field === 'role' || field === 'categories') {
			if (typeof value === 'string') {
				value = value.split(',').map((item: string) => item.trim());
			}
		}
		
		if (value !== null && value !== undefined) {
			data[field] = value;
		}
	}

	const user = await userService.UpdateUserByID(data);
	if (!user) {
		res.status(404).json(createErrorResponse(404, 'Data not found'));
		return;
	}

	await sendNotifications({
		creatorID: user._id,
		notificationType: 'update',
		notificationMessage: 'Your account has been Activated.'
	});

	// send mail to user
	const mailContent = accountActivatedMail(user.first_name);
	sendMail(user.email, "Your FESENSI Account Has Been Activated!", mailContent);
	res.status(200).json(createResponse(user));
});

export const getAllUsersByRole = asyncHandler(async (req: Request, res: Response) => {
	const users = await userService.getAllUsersByRole()
	if (!users || !users.length) {
		res.status(404).json(createErrorResponse(404, 'Data not found'))
		return;
	}
	res.status(200).json(createResponse(users))
})

export const activate_DeactivateUser = asyncHandler(async (req: Request, res: Response) => {
	const user = await userService.activate_DeactivateUser(req.params.id, req.body.status)
	if (!user) {
		res.status(404).json(createErrorResponse(404, 'Data not found'))
		return;
	}
	res.status(200).json(createResponse(user))
})

export const makeAdmin = asyncHandler(async (req: Request, res: Response) => {
	const user = await userService.makeAdmin(req.params.id)
	if (!user) {
		res.status(404).json(createErrorResponse(404, 'Data not found'))
		return;
	}
	res.status(200).json(createResponse(user))
})