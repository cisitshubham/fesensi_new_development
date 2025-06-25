import { Document, Schema } from 'mongoose'
import { BaseSchema } from '../common/dto/base.dto'

export enum TicketStatus {
    OPEN = 'OPEN',
    ASSIGNED = 'ASSIGNED',
    IN_PROGRESS = 'IN-PROGRESS',
    ON_HOLD = 'ON-HOLD',
    PARTIALLY_RESOLVED = 'RESOLVED',
    CLOSED = 'CLOSED',
}

export enum TicketPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL',
}

export interface ITicket extends BaseSchema, Document {
	ticket_number:Number;
    creator: Schema.Types.ObjectId
    title: string
    description: string
    status: TicketStatus
	IsAgentTicketEdit:Boolean
	isResolved:Boolean
	isAgentResolvedButtonShow:Boolean
	isAgentViewButtonShow:Boolean
	isAgentReAssign:Boolean
	isTicketClosed:Boolean
	isAgenForceResolve:Boolean
	resolvedPostsComment:string
	AgentreAssignComment:string
	adminReAssign:Boolean
	adminReAssignComment:string
    priority?: TicketPriority
    category?: string
	AgentreAssign?: Schema.Types.ObjectId
	reolvedPosts?: Schema.Types.ObjectId
    comments?: Schema.Types.ObjectId[]
    attachments?: Schema.Types.ObjectId[]
    audit_log?: Schema.Types.ObjectId[]
	sla?: Schema.Types.ObjectId[]
	esclation?: {
		_id: Schema.Types.ObjectId;
		assigned_to: {
			_id: Schema.Types.ObjectId;
			first_name: string;
		};
		escalation_time: Date;
		level_of_user: string;
	}[];
}
	
