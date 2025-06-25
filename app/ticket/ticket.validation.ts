import { body, checkExact, param } from 'express-validator'
import { TicketStatus } from './ticket.dto'

export const createTicket = checkExact([
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('status').default(TicketStatus.OPEN),
	body('priority').notEmpty().withMessage('Priority is required'),
	body('category').notEmpty().withMessage('Category is required'),
    body('attachments').optional(),
])
export const getTicketDetails = checkExact([param('id').notEmpty()])

export const createComment = checkExact([
	body('ticket').notEmpty().withMessage('Ticket ID is required'),
	body('comment_text').notEmpty().withMessage('Comment text is required'),
	body('images').optional(),
])

export const updateTicket = checkExact([
	body('title').optional(),
    body('description').optional(),
    body('status').optional(),
    body('priority').optional(),
    body('category').optional(),
	body('images').optional(),
])

export const TicketFilter= checkExact([
	body('status').optional().isIn(Object.values(TicketStatus)),
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

export const filter=checkExact([
	body('startDate').optional(),
	body('endDate').optional(),
])


export const TicketUpdate =  checkExact([
	body('ticket_id').notEmpty().withMessage('Ticket ID is required'),
	body('description').optional(),
	body('attachment_id').optional(),
	body('ticket_title').optional(),
]);
export const removeAttachmentFromTicket =  checkExact([
	body('ticket_id').notEmpty().withMessage('Ticket ID is required'),
	body('attachment_id').notEmpty().withMessage('Attachment ID is required'),
]);
export const isTicketResolved =  checkExact([
	body('ticket_id').notEmpty().withMessage('Ticket ID is required'),
]);
export const addFeedback =  checkExact([
	body('ticket').notEmpty().withMessage('Ticket ID is required'),
	body('comment').optional(),
	body('rating').notEmpty().isNumeric().withMessage('Rating is required and should be a number'),
	body('feedbackOptions').notEmpty().withMessage('Feedback Options is required'),
	body('feedbackfor').optional(),	
]);

export const createContactSupport = checkExact([
	body('contact_number').notEmpty().withMessage('Contact Number is required'),
	body('message').notEmpty().withMessage('Message is required'),
	body('calling_time').optional(),
]);

export const skipFeedback = checkExact([
	body('ticketId').notEmpty().withMessage('Ticket ID is required'),
]);
