
import express from 'express';
import mongoose, { Document } from 'mongoose';
import { Schema } from 'mongoose';

export interface IUserFcm extends Document {
  userId: mongoose.Schema.Types.ObjectId;	
  fcmToken: string;
  createdAt: Date;
  updatedAt: Date;
}
export const UserFcmSchema = new Schema<IUserFcm>(
	  {
	userId: {
	  type: mongoose.Schema.Types.ObjectId,
	  ref: 'User',
	  required: true,
	},
	fcmToken: String,
  },
  {
	timestamps: true,
  }
);
export const UserFcmModel = mongoose.model<IUserFcm>('FcmTokens', UserFcmSchema);
