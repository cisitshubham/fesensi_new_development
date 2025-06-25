import { UserFcmModel } from '../models/user-fcm.model';
import { Types } from 'mongoose';

export const createUserFcm = async (data: any) => {
	try {
		const result = await UserFcmModel.create({userId: data.userId, fcmToken: data.fcmTokens});
		return result;
	} catch (error) {
		return Promise.reject(error);
	}
};

export const getUserFcmToken = async (userId: any) => {
	const result = await UserFcmModel.find({ userId: userId }).select('fcmToken');
    return result;
}

export const getFcmTokenById = async (id: string) => {
	const result = await UserFcmModel.findOne({ fcmToken:id}).select('fcmToken');
	return result;
};