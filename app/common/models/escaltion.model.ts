import { Document, model, Schema } from 'mongoose'

export interface IEsclation extends Document {
	category_id:{
		    type: Schema.Types.ObjectId,
			ref: 'Categories',
            required: false,
        },
        assigned_to: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        level_of_user: {
            type: String,
            default: null,
        },
        escalation_time: {
            type: String,
            default: null,
        },
        escalation_reason: String,
        resolution_time: {
            type: Number,
        },
        breach_action: {
            type: String,
        },
        response_time: {
            type: Number,
        },
		ticket_id: {
			type: Schema.Types.ObjectId,
			ref: 'Ticket',
			required: true,
		},
		level2_escalated_time: {
			type: String,
			default: null,
		},
		level3_escalated_time: {
			type: String,
			default: null,
		},
		level2_escalated_reason: {
			type: String,
			default: null,
		},
		level3_escalated_reason: {
			type: String,
			default: null,
		},
        status: { type: String, }
}


const Esclation = new Schema(
	{
		category_id: {
			type: Schema.Types.ObjectId,
			ref: 'Categories',
			required: false,
		},
		assigned_to: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		level_of_user: {
			type: String,
			default: null,
		},
		escalation_time: {
			type: String,
			default: null,
		},
		escalation_reason: {
			type: String,
		},
		resolution_time: {
			type: Number,
		},
		breach_action: {
			type: String,
		},
		response_time: {
			type: Number,
		},
		ticket_id: {
			type: Schema.Types.ObjectId,
			ref: 'Ticket',
			required: true,
		},
		level2_escalated_time: {
			type: String,
			default: null,
		},
		level3_escalated_time: {
			type: String,
			default: null,
		},
		level2_escalated_reason: {
			type: String,
			default: null,
		},
		level3_escalated_reason: {
			type: String,
			default: null,
		},

		status: { type: String, }
	},
	{
		timestamps: true,
	}
)
export const esclation = model<IEsclation>('Esclation', Esclation)

