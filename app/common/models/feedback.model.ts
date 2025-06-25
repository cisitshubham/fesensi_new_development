import { FeedbackOptions } from './../../admin/admin.validator';
import { Document, model, Schema } from 'mongoose'

export interface IFeedback extends Document {

	comment: String,
	rating: Number,
	creator: Schema.Types.ObjectId,		
	ticket:  Schema.Types.ObjectId,
	feedbackOptions: Schema.Types.ObjectId,
	feedbackfor: Schema.Types.ObjectId,
}

const feedback = new Schema(
	{
		comment:String,
		rating:Number,
		creator:{
			type:Schema.Types.ObjectId,
			ref:'User'
		},
		ticket: {
			type: Schema.Types.ObjectId,
			ref: 'Ticket',
			required: true,
		},
		feedbackOptions: {
			type: Schema.Types.ObjectId,
			ref: 'FeedbackOptions',
		},
		feedbackfor: {
			type: Schema.Types.ObjectId,
			ref: 'User',	
			default: null,
		},	
	},
	{
		timestamps: true,
	}
)

export const Feedback = model<IFeedback>('Feedbacks', feedback)
