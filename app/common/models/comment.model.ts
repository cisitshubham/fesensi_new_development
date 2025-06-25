import { Document, model, Schema } from 'mongoose'

export interface IComment extends Document {
    ticket: Schema.Types.ObjectId
    creator: Schema.Types.ObjectId
    comment_text: string
}

const commentSchema = new Schema(
    {
        ticket: {
            type: Schema.Types.ObjectId,
            ref: 'Ticket',
            required: true,
        },
        creator: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        comment_text: {
            type: String,
            required: true,
        },
		attachments: [{
			type: Schema.Types.ObjectId,
			ref: 'Attachment',
            required: false,
		}]
    },
    {
        timestamps: true,
    }
)

export const Comment = model<IComment>('Comment', commentSchema)
