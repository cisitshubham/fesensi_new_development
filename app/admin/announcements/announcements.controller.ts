import { Request, Response } from 'express';
import {createErrorResponse,createEmptyResponse,createResponse } from '../../common/helper/response.helper'
import { createAnnouncement, getAnnouncements, updateAnnouncement, deleteAnnouncement, getAnnouncementById, getAnnouncementByStatus } from './announcements.service';
import asyncHandler from 'express-async-handler'
import { sendAnnouncementNotification } from '../../common/services/push-notification.service';
import { getAllUsers } from '../user/user.service';


export const createAnnouncementController = asyncHandler(async (req: Request, res: Response) => {
	const user = (req as any).user;
	const { title, content } = req.body;
	const announcement = await createAnnouncement({ title, content, status: true, created_by: user._id });
	if(!announcement){
		res.send(createErrorResponse(400, "Announcement creation failed"));
	}
	const users = await getAllUsers();	
	const userIds = users.map(user => user._id);
	const data = {
		title: 'Announcement',
		content: title,
		userId: userIds,
		notificationType: 'announcement'
	}
	await sendAnnouncementNotification(data);
	res.send(createResponse(announcement,"Announcement created successfully"));
	return
});

export const getAnnouncementsController = asyncHandler(async (req: Request, res: Response) => {
	const announcements = await getAnnouncements();
	res.send(createResponse(announcements,"Announcements fetched successfully"));
	return
});

export const updateAnnouncementController = asyncHandler(async (req: Request, res: Response) => {
	const { id } = req.params;
	const { title, content  } = req.body;
	const announcement = await updateAnnouncement(id, { title, content, status: true });
	res.send(createResponse(announcement,"Announcement updated successfully"));
	return
});

export const deleteAnnouncementController = asyncHandler(async (req: Request, res: Response) => {
	const { id } = req.params;
	const announcement = await deleteAnnouncement(id);
	res.send(createResponse(announcement,"Announcement deleted successfully"));
	return
});

export const getAnnouncementByIdController = asyncHandler(async (req: Request, res: Response) => {
	const { id } = req.params;
	const announcement = await getAnnouncementById(id);
	res.send(createResponse(announcement,"Announcement fetched successfully"));
	return
});

