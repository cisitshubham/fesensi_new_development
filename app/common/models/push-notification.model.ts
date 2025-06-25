import express from 'express';
import mongoose, { Document } from 'mongoose';
import { Schema } from 'mongoose';


export interface IPushNotification extends Document {
  userId: mongoose.Schema.Types.ObjectId;	
  fcmToken: string;
  isEnabled: boolean;
  notificationType: string; // 'login' | 'transaction' | 'other'
  notificationMessage: string;
  createdAt: Date;
  updatedAt: Date;
}
export enum NotificationType {
  LOGIN = 'login',
  TRANSACTION = 'transaction',
  OTHER = 'other',
  REGISTER = 'register',
  UPDATE = 'update',
  RESOLUTION_TIME_REMINDER = 'resolution_time_reminder',
  FORCE_RESOLVE = 'force_resolve',
  ANNOUNCEMENT = 'announcement',
}
export const PushNotificationSchema = new Schema<IPushNotification>(
	  {
		userId: {
		  type: mongoose.Schema.Types.ObjectId,
		  ref: 'User',
		  required: true,
		},
		isEnabled: {
		  type: Boolean,
		  default: true,
		},
		notificationType: {
		  type: String,
		  enum: Object.values(NotificationType),
		  default: NotificationType.OTHER,
		},
		notificationMessage: {
		  type: String,
		  required: true,
		},
		fcmToken: {
		  type: String,	
		},
	  },
	  {
		timestamps: true,
	  }
);
export const PushNotificationModel = mongoose.model<IPushNotification>('PushNotifications', PushNotificationSchema);