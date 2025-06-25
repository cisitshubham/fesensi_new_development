import mongoose from 'mongoose';

interface IContactSupport extends mongoose.Document {
	contact_number: string;
	is_resolved: boolean;
    message: string;
    calling_time: string;
	contact_mode: string;
	query_type: mongoose.Types.ObjectId | { title: string };
	created_by: mongoose.Types.ObjectId | { first_name: string };
    createdAt: Date;
}

const contactSupportSchema = new mongoose.Schema({
	is_resolved: {
		type: Boolean,
		default: false,
	},
	contact_mode: {
		type: String,
		enum: ['call', 'email', 'whatsapp'],
		default: 'email',
	},
	message: {
		type: String,
		required: true,
	},
	calling_time: {
		type: String,
	},
	query_type: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'ContactSupportOptions',
	},
	created_by: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	},
	{
		timestamps: true,
	}
);


export const ContactSupport = mongoose.model<IContactSupport>('contactSupport', contactSupportSchema);
