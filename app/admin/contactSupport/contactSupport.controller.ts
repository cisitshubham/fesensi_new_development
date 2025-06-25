import { Request, Response } from 'express'
import { createResponse, createErrorResponse, createEmptyResponse, } from '../../common/helper/response.helper'
import asyncHandler from 'express-async-handler'
import * as contactSupportService from './contactSupport.service'
import { sendMail } from '../../common/services/mail.service'
import { queryResolvedMail } from '../../mail/mail.templates'
import { getUserByID } from './../user/user.service';



export const createContactSupport = asyncHandler(async (req: Request, res: Response) => {
	const { contact_number, message, calling_time } = req.body;
	const contactSupport = await contactSupportService.createContactSupport({ contact_number, message, calling_time });
	if (!contactSupport) {
		res.send(createErrorResponse(400, 'Failed to create contact support'));
		return;
	}
	res.send(createResponse(contactSupport));
});


export const getContactSupport = asyncHandler(async (req: Request, res: Response) => {
	const contactSupport = await contactSupportService.getContactSupport();
	if (!contactSupport) {
		res.send(createErrorResponse(400, 'Failed to get contact support'));
		return;
	}
	res.send(createResponse(contactSupport));
});


export const getContactSupportById = asyncHandler(async (req: Request, res: Response) => {
	const { id } = req.params;
	const contactSupport = await contactSupportService.getContactSupportById(id);
	if (!contactSupport) {
		res.send(createErrorResponse(400, 'Failed to get contact support'));
		return;
	}
	res.send(createResponse(contactSupport));
});


export const deleteContactSupport = asyncHandler(async (req: Request, res: Response) => {
	const { id } = req.params;
	const contactSupport = await contactSupportService.deleteContactSupport(id);
	if (!contactSupport) {
		res.send(createErrorResponse(400, 'Failed to delete contact support'));
		return;
	}
	res.send(createResponse(contactSupport));
});


export const updateContactSupport = asyncHandler(async (req: Request, res: Response) => {
	const { id } = req.params;
	const contactSupport = await contactSupportService.updateContactSupport(id);
	if (!contactSupport) {
		res.send(createErrorResponse(400, 'Failed to update contact support'));
		return;
	}
	const user = await getUserByID(typeof contactSupport.created_by === 'string'? contactSupport.created_by: contactSupport.created_by?.toString());
	const userEmail = user?.email;
	if (userEmail) {
		const mailBody = queryResolvedMail(user?.first_name, contactSupport.message);
		await sendMail(  userEmail,  'Query Resolved', mailBody);
	}
	res.send(createResponse(contactSupport));
});
