import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import { createResponse, createErrorResponse, createEmptyResponse, } from '../../common/helper/response.helper'
import * as AdminTicketService from './ticket.service'
import { getUserById } from '../../user/user.service'
import { getPriorityByID } from '../../admin/priority/priority.service'
import { sendNotifications } from '../../common/services/push-notification.service'
import * as contactSupportService from '../contactSupport/contactSupport.service'
import { CreateAuditLog } from '../../auditlog/auditLog.service'



export const getTicketsCharts = asyncHandler(
	async (req: Request, res: Response) => {
		const { fromDate, todate } = req.body;
		const status = req.params.status;
		const page = Math.max(1, parseInt(req.query.page as string) || 1);
		const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
		const user = (req as any).user;
		const userId = user._id;
		const data = {
			UserId: userId,
			status: status,
			fromDate: fromDate,
			todate: todate,
			page: page,
			limit: limit,
		}
		if (status) {
			const statusCount = await AdminTicketService.getTicketDetailsByStatus(data, fromDate, todate);
			if (!statusCount) {
				res.send(createEmptyResponse());
				return;
			}
			res.send(createResponse(statusCount, "Data Loaded"));
			return;
		}
		const result = await AdminTicketService.getTicketsCharts(data);
		if (!result) {
			res.send(createEmptyResponse())
			return;
		}
		res.json(createResponse(result, 'Data Loaded'));
	}
);

export const getAllTicketsByAdmin = asyncHandler(
	async (req: Request, res: Response) => {
		const page = Math.max(1, parseInt(req.query.page as string) || 1);
		const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
		const data = {
			page,
			limit,
		};
		const result = await AdminTicketService.getAllTicketsByAdmin(data);
		if (!result || !Array.isArray(result.result) || result.result.length === 0) {
			res.send(createEmptyResponse());
			return;
		}
		res.send(createResponse(result, "Data Loaded"));
	}
)


export const getTicketCategoryCount = asyncHandler(
	async (req: Request, res: Response) => {
		const { startDate, endDate } = req.body;
		const userId = (req as any).user._id;
		let filter = {
			startDate: startDate,
			endDate: endDate,
			userId: userId,
		}
		const result = await AdminTicketService.getTicketCategoryCount(filter);
		if (!result) {
			res.send(createEmptyResponse());
			return;
		}
		res.send(createResponse(result, "Data Loaded"));
	}
);

export const getTicketsRequestReassign = asyncHandler(
	async (req: Request, res: Response) => {

		if (req.params.status === 'approved') {
			const data = {
				adminReAssign: true,
			}
			const result = await AdminTicketService.getTicketsRequestReassign(data);
			if (!result || result.length === 0) {
				res.send(createEmptyResponse());
				return;
			}
			res.send(createResponse(result, "Data Loaded"));
			return;
		}
		const data = { isAgentReAssign: false, }
		const result = await AdminTicketService.getTicketsRequestReassign(data);
		if (!result || result.length === 0) {
			res.send(createEmptyResponse());
			return;
		}
		res.send(createResponse(result, "Data Loaded"));
	}
);


export const getTicketById = asyncHandler(
	async (req: Request, res: Response) => {
		const { id } = req.params;
		const result = await AdminTicketService.getTicketById(id);
		if (!result) {
			res.send(createEmptyResponse());
			return;
		}
		res.send(createResponse(result, "Data Loaded"));
	}
);


export const updateTicketReassign = asyncHandler(
	async (req: Request, res: Response) => {
		const { ticketId, adminReAssignComment } = req.body;
		const data = {
			ticketId: ticketId,
			adminReAssignComment: adminReAssignComment,
		}
		const result = await AdminTicketService.updateTicketReassign(data);
		if (!result) {
			res.send(createEmptyResponse());
			return;
		}
		res.send(createResponse(result, 'Ticket Reassigned to Agent'));
	}
);

export const AssignTicketToAgent = asyncHandler(
	async (req: Request, res: Response) => {

		const { ticketId, assigned_to } = req.body;
		const currentUser = (req as any).user;
		const UserId = currentUser._id;
		const user = await getUserById(assigned_to);
		const ticket = await AdminTicketService.getTicketbyId(ticketId);


		const category_id = (ticket as any).category;
		const priority_id = (ticket as any).priority;
		const escalationHrs = await getPriorityByID(priority_id);
		const escalation_hrs = (escalationHrs as any).esclationHrs;
		const escalation_time = new Date(new Date().getTime() + escalation_hrs * 60 * 60 * 1000);
		const escalation_time_iso = new Date(escalation_time).toISOString();
		const data = {
			ticket_id: ticketId,
			category_id: category_id,
			assigned_to: assigned_to,
			level_of_user: user?.level,
			escalation_reason: 'Admin Reassign the ticket to agent as per the request of the Agent',
			escalation_time: escalation_time_iso,
		}
		const result = await AdminTicketService.AssignTicketToAgent(data);
		if (!result) {
			res.send(createEmptyResponse());
			return;
		}

		// Push Notification
		const creatorID = (result as any).creator;
		const ticketNumber = (result as any).ticket_number;
		const pushNotification = {
			creatorID: UserId,
			userId: assigned_to,
			title: 'Ticket Reassigned to Agent',
			userNotification: `Ticket Number: #${ticketNumber} — Ticket has been re-assigned to higher level.`,
			agentNotification: `Ticket Number: #${ticketNumber} — Ticket has been re-assigned to you.`,
			notificationType: 'other',
		};
		await sendNotifications(pushNotification);

		// Audit log
		let AuditLog = await CreateAuditLog({
			ticket: ticketId,
			creator: UserId,
			action: `Ticket Number: #${ticketNumber} — Ticket has been re-assigned to higher level by Admin.`,
		});	
		await AdminTicketService.updateTicketID(AuditLog);
		res.send(createResponse(result, "Ticket Reassigned to Agent"));
	}
);

export const CreateContactSupport = asyncHandler(
	async (req: Request, res: Response) => {
		const { name, email, message, calling_time } = req.body;
		const contactSupport = await contactSupportService.createContactSupport({ name, email, message, calling_time });
		if (!contactSupport) {
			res.send(createErrorResponse(400, 'Failed to create contact support'));
			return;
		}
		res.send(createResponse(contactSupport, 'Your request has been sent to the support team'));
	}
);

export const getContactSupport = asyncHandler(
	async (req: Request, res: Response) => {
		const user = (req as any).user;
		const userId = user._id;
		const contactSupport = await contactSupportService.getContactSupportByUserId(userId);
		if (!contactSupport) {
			res.send(createErrorResponse(400, 'Failed to get contact support'));
			return;
		}
		res.send(createResponse(contactSupport));
	}
);


