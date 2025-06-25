import { Document, model, Schema } from 'mongoose'

export interface IAttachment extends Document {
    ticket: Schema.Types.ObjectId
    comment: Schema.Types.ObjectId
    file_url: string
    file_type: string
}

const attachmentSchema = new Schema(
    {
        ticket: {
            type: Schema.Types.ObjectId,
			ref: 'Ticket',
            required: true,
        },
        comment: {
            type: Schema.Types.ObjectId,
            ref: 'Comment',
            required: false,
        },
        file_url: {
            type: String,
            required: true,
        },
        file_type: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
)

export const Attachment = model<IAttachment>('Attachment', attachmentSchema)
