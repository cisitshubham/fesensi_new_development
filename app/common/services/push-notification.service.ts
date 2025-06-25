import {PushNotificationModel} from '../models/push-notification.model';
import * as sendNotification from './firebase.service';
import { createUserFcm, getUserFcmToken } from './fcmUser.service';




export const createPushNotification = async (userId: any, fcmToken?: string, notificationType?: string, notificationMessage?: string) => {
	try {
		const newNotification = new PushNotificationModel({
			userId,
			fcmToken,
			notificationType,
			notificationMessage,
		});
		await newNotification.save();
		return newNotification;
	} catch (error) {
		console.error('Error creating push notification:', error);
		throw error;
	}
}

export const getAllPushNotifications = async (userId: string) => {
	
	try {
		const notifications = await PushNotificationModel.find({ userId: userId }).sort({ createdAt: -1 }).select('id isEnabled notificationType notificationMessage createdAt updatedAt');
		return notifications;
	} catch (error) {
		console.error('Error fetching push notifications:', error);
		throw error;
	}
}

export const deletePushNotification = async (notificationId: string) => {
	try {		
		const deletedNotification = await PushNotificationModel.findByIdAndDelete(notificationId);
		return deletedNotification;
	} catch (error) {
		console.error('Error deleting push notification:', error);
		throw error;
	}
}

export const deleteAllPushNotifications = async (userId: string) => {
	try {
		await PushNotificationModel.deleteMany({ userId: userId });
	} catch (error) {
		console.error('Error deleting push notifications:', error);
		throw error;
	}
}


export const updatePushNotification = async (notificationId: string, updateData: any) => {
	try {
        const updatedNotification = await PushNotificationModel.findByIdAndUpdate(notificationId, updateData, { new: true });
        return updatedNotification;
    } catch (error) {
        console.error('Error updating push notification:', error);
        throw error;
    }
}


// Send Notification Agent and User 
export const sendNotifications = async (data:any)=>{

	const creatorID = data.creatorID;
	const userId= data.userId;
	const title =data.title
	const userNotification = data.userNotification
	const agentNotification = data.agentNotification
	const notificationType = data.notificationType

	// Get FCM tokens
	const CreatorTokens = await getUserFcmToken(creatorID);
	const AgentTokens = await getUserFcmToken(userId);

	// Extract unique tokens
	const agentTokens = [...new Set(AgentTokens.map(t => t.fcmToken))];
	const userTokens = [...new Set(CreatorTokens.map(t => t.fcmToken))];
	
	// === Agent Notification ===
	if (agentTokens.length > 0) {
		await sendNotification.sendNotification(
			agentTokens,
			title,
			agentNotification
		);

		await createPushNotification(
			userId,
			'',
			notificationType,
			agentNotification
		);
	}

	// === User Notification ===
	if (creatorID !== userId && userTokens.length > 0) {
		await sendNotification.sendNotification(
			userTokens,
			title,
			userNotification
		);
		await createPushNotification(
			creatorID,
			 '',
			notificationType,
			userNotification
		);
	}



	
}

// Send Announcement Notification
export const sendAnnouncementNotification = async (data:any)=>{
	const {title, content, userId, notificationType} = data;	
	const userIds = Array.isArray(userId) ? userId : [userId];
	// Process each user
	for (const singleUserId of userIds) {
		const userTokens = await getUserFcmToken(singleUserId);
		const tokens = userTokens.map(t => t.fcmToken);
		const uniqueTokens = [...new Set(tokens)];
		if (uniqueTokens.length > 0) {
			const announcementData = {
				title,
				content,
				tokens: uniqueTokens,
			};
			await sendNotification.sendAnnouncementNotification(announcementData);
			await createPushNotification(singleUserId, '', notificationType, content);
		}
	}
}

