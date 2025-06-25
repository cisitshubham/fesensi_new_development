import { model, Schema } from 'mongoose'
import { ITicket, TicketPriority, TicketStatus } from '../../ticket/ticket.dto'

const ticketSchema = new Schema(
    {
		ticket_number: Number,
        creator: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        title: {
            type: String,
        },
        description: {
            type: String,
        },
        status: {
            type: String,
            enum: TicketStatus,
        },
		IsAgentTicketEdit: {
            type: Boolean,
           	default:false,
        },
		isResolved: {
            type: Boolean,
           	default:false,
        },
		isAgentResolvedButtonShow: {
            type: Boolean,
           	default:false,
        },

		isAgentViewButtonShow: {
            type: Boolean,
           	default:false,
        },
		isAgentReAssign: {
            type: Boolean,
           	default:true,
        },
		isAgenForceResolve: {
            type: Boolean,
           	default:false,
        },
		isTicketClosed: {
            type: Boolean,
           	default:false,
        },
        priority: {
            type: Schema.Types.ObjectId,
            ref: "Priorities",
        },
        category: {
            type: Schema.Types.ObjectId,
			ref: 'Categories',
        },
        resolvedPosts: {
            type: Schema.Types.ObjectId,
			ref: 'ResolvedPosts',
        },
		resolvedPostsComment: {
			type: String,
			default:null,
        },
		adminReAssign: {
			type: Boolean,
			default:false,
		},
		adminReAssignComment: {
			type: String,
			default:null,
		},
        AgentreAssign: {
            type: Schema.Types.ObjectId,
			ref: 'Reassignments',
        },
		isFeedback: {
			type: Boolean,
			default:false,
		},
		isEsclatedL2: {
			type: Boolean,
			default:false,
		},
		isEsclatedL3: {
			type: Boolean,
			default:false,
		},
        AgentreAssignComment: {
            type: String,
			default:null,
        },
        comments: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Comment',
            },
        ],
        attachments: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Attachment',
            },
        ],
		sla: [
			{
				type: Schema.Types.ObjectId,
				ref: 'sla',
			},
		],
		esclation: [
			{
				type: Schema.Types.ObjectId,
				ref: 'Esclation',
			},
		],
        audit_log: [
            {
                type: Schema.Types.ObjectId,
                ref: 'AuditLog',
            },
        ],
    },
    {
        timestamps: true,
    }
)

export const Ticket = model<ITicket>('Ticket', ticketSchema)
