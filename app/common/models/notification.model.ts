import { Document, model, Schema } from 'mongoose'

export interface INotification extends Document {
    receiver: Schema.Types.ObjectId
    ticket: Schema.Types.ObjectId
    message: string
    is_read: boolean
}

const notificationSchema = new Schema(
    {
        receiver: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        ticket: {
            type: Schema.Types.ObjectId,
            ref: 'Ticket',
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        is_read: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
)

export const Notification = model<INotification>(
    'Notification',
    notificationSchema
)
