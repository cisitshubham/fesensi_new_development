import { IFeedback } from './feedback.model';

import { Document, model, Schema } from 'mongoose'
export interface IFeedbackOptions extends Document {
	title: String,
	creator: Schema.Types.ObjectId,
}

const enum FeedbackStatus {
	ACTIVE = 'active',
	INACTIVE = 'inactive', 
}
const FeedBackOptions = new Schema(
	{
		title: String,
		creator: Schema.Types.ObjectId,
		status: {
			type: String,
			enum: [FeedbackStatus.ACTIVE, FeedbackStatus.INACTIVE],
			default: FeedbackStatus.ACTIVE,
		},
	},
	{
		timestamps: true,
	}
)

export const Feedback = model<IFeedbackOptions>('FeedbackOptions', FeedBackOptions)
