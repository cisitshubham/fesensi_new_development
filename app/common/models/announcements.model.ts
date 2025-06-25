import { Schema, model } from 'mongoose';

interface IAnnouncement extends Document {
	title: string;
	content: string;
	status: boolean;
	createdAt: Date;
	updatedAt: Date;
}


const announcementSchema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
	status: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

export const Announcements = model<IAnnouncement>('Announcements', announcementSchema);

