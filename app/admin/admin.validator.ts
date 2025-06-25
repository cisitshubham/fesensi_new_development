import { Feedback } from './../common/models/feedback.model';
import { body, checkExact, header, param } from 'express-validator'
export const role = checkExact([
	header('Authorization').exists().notEmpty(),
	body('role_name').notEmpty(),
	body('permissions').optional().isArray(),
	
]) 

export const createUser = checkExact([
	body('first_name').notEmpty().withMessage('first name is required'),
	body('email').notEmpty().withMessage('email is required'),
	body('password').notEmpty().withMessage('password is required'),
	body('role').notEmpty().withMessage('role is required'),
	body('image').optional(),
	body('level').notEmpty().withMessage('level is required')	,
	body('categories').notEmpty().withMessage('categories is required'),
	body('priority').notEmpty().withMessage('priority is required'),
]);

export const updateUser = checkExact([
	body('first_name').optional(),
	body('email').optional(),
	body('password').optional(),
	body('role').optional(),
	body('image').optional(),
	// 'department',
	body('status').optional(),
	body('level').optional(),
	body('categories').optional(),
	body('priority').optional(),
	body('created_at').optional(),
	body('updated_at').optional()
]);

export const resolvePostCreate = checkExact([
	body('title').notEmpty(),
]);
export const resolvePostUpdate = checkExact([
	body('title').optional(),
]);

export const createPriorities = checkExact([
	body('title').notEmpty(),
	body('esclationHrs').notEmpty(),
	body('responseHrs').optional(),
	body('colourCode').optional(),
]);



export const FeedbackOptions = checkExact([
	body('title').notEmpty(),
]);

export const FeedbackOptionsUpdate = checkExact([
	body('title').optional(),
]);

export const assignPermissionsToRole = checkExact([
	body('roleId').notEmpty().withMessage('role id is required'),
	body('permissions').notEmpty().isArray().withMessage('permission is required'),
]);

export const deletePermissionsFromRole = checkExact([
	body('roleId').notEmpty().withMessage('role id is required'),
	body('permissionId').notEmpty().withMessage('permission id is required'),
]);


export const createAnnouncement = checkExact([
	body('title').notEmpty().withMessage('title is required'),
	body('content').notEmpty().withMessage('content is required'),
]);

export const updateAnnouncement = checkExact([
	body('title').optional(),
	body('content').optional(),
]);

export const deleteAnnouncement = checkExact([
	param('id').notEmpty().withMessage('id is required'),
]);

export const updateTicketReassign = checkExact([
	body('ticketId').notEmpty().withMessage('ticket id is required'),
	body('adminReAssignComment').notEmpty().withMessage('admin reassign comment is required'),
]);

export const assignTicketToAgent = checkExact([
	body('ticketId').notEmpty().withMessage('ticket id is required'),
	body('assigned_to').notEmpty().withMessage('assigned to is required'),
]);


export const createCategories = checkExact([
	body('title').notEmpty().withMessage('title is required'),
]);

export const updateCategories = checkExact([
	body('title').optional(),
]);


export const createContactSupportOptions = checkExact([
	body('title').notEmpty().withMessage('title is required'),
]);

export const updateContactSupportOptions = checkExact([
	body('title').optional(),
]);


export const createTrustLevelInfo = checkExact([
	body('level').notEmpty().withMessage('level is required'),
	body('levelInfo').notEmpty().withMessage('level info is required'),
	body('min').notEmpty().withMessage('min is required'),
	body('rating').notEmpty().withMessage('rating is required'),
	body('sla').notEmpty().withMessage('sla is required'),
	body('notResolved').notEmpty().withMessage('not resolved is required'),
	body('responseTime').notEmpty().withMessage('response time is required'),
]);

export const updateTrustLevelInfo = checkExact([
	body('level').optional(),
	body('levelInfo').optional(),
	body('min').optional(),
	body('rating').optional(),
	body('sla').optional(),
	body('notResolved').optional(),
	body('responseTime').optional(),
]);

export const deleteTrustLevelInfo = checkExact([
	param('id').notEmpty().withMessage('id is required'),
]);

