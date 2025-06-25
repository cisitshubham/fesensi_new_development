import { Document, model, Schema } from 'mongoose'

export interface IAuditLog extends Document {
    ticket: Schema.Types.ObjectId
    creator: Schema.Types.ObjectId
    action: string
}

const auditLogSchema = new Schema(
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
        action: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
)

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema)
