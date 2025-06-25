import { body, checkExact, param } from 'express-validator'

export const addResolution = checkExact([
	body('ticket_id').notEmpty().withMessage('Ticket ID is required'),
	body('resolution').notEmpty().withMessage('Resolution is required'),
	body('image').optional()
]);
export const addResovedPost = checkExact([
	body('ticket_id').notEmpty().withMessage('Ticket ID is required'),
	body('resolvedPostId').notEmpty().withMessage('Resolved Post ID is required'),
	body('resolvedPostsComment').optional(),
	body('status').optional(),
	body('image').optional()
]);
export const requestReAssign = checkExact([
	body('ticket_id').notEmpty().withMessage('Ticket ID is required'),
	body('AgentreAssign').notEmpty().withMessage('Agent Reassign is required'),
	body('AgentreAssignComment').optional(),
	body('image').optional()
]);
export const closedTicket = checkExact([
	body('ticket_id').notEmpty().withMessage('Ticket ID is required'),
	body('image').optional()
]);

export const Ticketincomplete = checkExact([
	body('ticket_id').notEmpty().withMessage('Ticket ID is required'),
	body('comment_text').notEmpty().withMessage('Incomplete Comment is required'),
	body('status').optional(),
	body('image').optional()
]);

export const TicketFilter = checkExact([
	body('status').optional(),
	body('priority').optional(),
	body('category').optional(),
	body('assigned_to').optional(),
	body('created_by').optional(),
	body('escalation').optional(),
	body('sla').optional(),
	body('due_date').optional(),
	body('startDate').optional(),
	body('endDate').optional(),
])

export const createContactSupport = checkExact([
	body('message').notEmpty().withMessage('Message is required'),
	body('query_type').notEmpty().withMessage('Query Type is required'),
	body('calling_time').optional(),
])
