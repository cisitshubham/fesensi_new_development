import { Request, Response } from 'express'
import { createResponse, createErrorResponse, createEmptyResponse, } from '../common/helper/response.helper'
import asyncHandler from 'express-async-handler'
import * as agentService from './agent.service'
import { CreateAttachments } from '../attachments/attachment.service'
import { CreateAuditLog } from '../auditlog/auditLog.service'
import mongoose from 'mongoose';
import { sendNotifications} from '../common/services/push-notification.service';
import * as contactSupportService from '../admin/contactSupport/contactSupport.service'



export const dashboard = asyncHandler(
	async (req: Request, res: Response) => {
		const user = (req as any).user;
		const userId = user._id;
		const { fromDate, todate } = req.query;	
		const data = {
			fromDate,
			todate,
			UserId: userId,
		}	
		const result = await agentService.getTicketCount(data);
		if (req.params.status) {
			let data = {
				fromDate,
				todate,
				status: req.params.status,
				UserId: userId,
				page: 1,
				limit: 10,
			};
			let tickets = await agentService.getTicketDetailsByStatus(data);
			res.send(createResponse(tickets, "Data Loaded"));
			return;
		}
		if(!result){
			res.send(createEmptyResponse());
			return;
		}
		res.json(createResponse(result,'Data Loaded'));
	}
);

export const getTicketsCharts = asyncHandler(
	async (req: Request, res: Response) => {
		const { fromDate,todate} = req.body;
		const user = (req as any).user;
		const userId = user._id;			
		const data = {
			UserId: userId,
			status: req.params.status,	
			fromDate:fromDate,
			todate:todate,
		}	
		if (req.params.status) {
			let data = {
				fromDate,
				todate,
				status: req.params.status,
				UserId: userId,
				page: 1,
				limit: 10,
			};
			let tickets = await agentService.getTicketDetailsByStatus(data);
			res.send(createResponse(tickets, "Data Loaded"));
			return;
		}
				
		const result = await agentService.getTicketsCharts(data);
		if (!result) {
			res.send(createEmptyResponse())
			return;
		}
		res.json(createResponse(result, 'Data Loaded'));
	}
);

export const myTickets= asyncHandler(
		async (req:Request,res:Response)=>{
		const user = (req as any).user;
		const userId = user._id;
		const result = await agentService.getAllTickets(userId);
		if(!result.length){
			res.send(createEmptyResponse())
			return;
		}
		if (req.params.status) {
			let data = {
				status: req.params.status,
				UserId: userId,
				role: user.role,
				page: 1,
				limit: 10,
			};
			let tickets = await agentService.getTicketDetailsByStatus(data);
			if (!tickets) {
				res.send(createEmptyResponse())
				return;
			}
			res.send(createResponse(tickets, "Data Loaded"));
			return;
			}
		res.send(createResponse(result,'Data Loaded'))	
});

export const TicketFilter = asyncHandler(async (req: Request, res: Response) => {	
	const user = (req as any).user;
	const UserId = user._id;
	const role = user.role;
	const statusParam = req.params.status;	
	const {
		category = [],
		startDate,
		endDate,
		priority = [],
		assigned_to,
		status = [],
		page = 1,
		limit = 10,
	} = req.body;

	
	const parsedStartDate = Array.isArray(startDate) ? startDate[0] : startDate;
	const parsedEndDate = Array.isArray(endDate) ? endDate[0] : endDate;	
	const isStartDateValid = typeof parsedStartDate === "string" && parsedStartDate.trim() !== "" && parsedStartDate !== "null";
	const isEndDateValid = typeof parsedEndDate === "string" && parsedEndDate.trim() !== "" && parsedEndDate !== "null";

	const hasAnyFilter =(category.length > 0 || priority.length > 0 || assigned_to || status.length > 0 || isStartDateValid || isEndDateValid || statusParam);	
	let tickets;
	if (!hasAnyFilter) {
		tickets = await agentService.getAllTickets(UserId, role);
	} else {
		const filterData: any = {
			UserId,
			role,
			page,
			limit,
		};

		if (category.length > 0) filterData.category = category;
		if (priority.length > 0) filterData.priority = priority;
		if (status.length > 0) filterData.status = status;
		if (assigned_to) filterData.assigned_to = assigned_to;
		if (isStartDateValid) filterData.startDate = startDate;
		if (isEndDateValid) filterData.endDate = endDate;
		if (statusParam) filterData.status = statusParam;
				
		tickets = await agentService.getFilteredTickets(filterData);
	}

	if (!tickets || !tickets.length) {
		res.send(createEmptyResponse());
		return;
	}

	res.send(createResponse(tickets, "Data Loaded"));
});



export const  getTicketDetails = asyncHandler(
	async (req:Request,res:Response) => {
		const ticketId = req.params.id;
		const result= await agentService.getTicketDetails(ticketId);
		if (!result || (Array.isArray(result) && result.length === 0)) {
			res.send(createEmptyResponse())
			return;
		}
		const ticket = Array.isArray(result) ? result[0] : result;
		res.send(createResponse(ticket, 'Data Loaded'))		
	}
)

export const addResolution = asyncHandler(async (req: Request, res: Response) => {
	const session = await mongoose.startSession();

	try {
		await session.withTransaction(async () => {
			const data = req.body;
			const user = (req as any).user;
			const UserId = user._id;
			const resolutionData = {
				ticket: data.ticket_id,
				comment_text: data.resolution,
				creator: UserId,
				status:'IN-PROGRESS',
				isResolved:true,
				isAgentResolvedButtonShow:true,
				isAgentViewButtonShow:false,
			};

			const result = await agentService.addResolution(resolutionData);
			if (!result) {
				throw new Error("Failed to submit resolution.");
			}
			
			const files = req.files as Express.Multer.File[];
			const imageUrls = files.map(file => `${process.env.APP_URL}/images/miscellaneous/${file.filename}`);
			const fileTypes = files.map(file => file.mimetype);
				
			const attachments = files.map((file, index) => ({
				ticket: data.ticket_id,
				file_url: imageUrls[index],
				file_type: fileTypes[index]
			}));
			
			const savedAttachments = await CreateAttachments(attachments);
			const attachmentIDs = savedAttachments.map(att => att._id);
			
			let ticket = await agentService.getTicketByID(data.ticket_id)
			let creatorID=ticket?.creator
			const ticketNumber=ticket?.ticket_number;
			// Push Notification
			const pushNotification = {
				creatorID: creatorID,
				userId: UserId,
				title: 'Ticket Resolution',
				userNotification: `Ticket Number: #${ticketNumber} — A new resolution is available.`,
				agentNotification: `Ticket Number: #${ticketNumber} — A resolution has been sent.`,
				notificationType: 'other',
			};
			await sendNotifications(pushNotification);
			
			// Audit log
			let AuditLog=await CreateAuditLog({
				ticket: data.ticket_id,
				creator: UserId,
				action: "Resoulation added by Agent."
			}, session);

			await agentService.updateAuditLog(data.ticket_id, String(AuditLog._id));
			const updateAttachmentIDs = {
				commentId: result._id,
				ticketId: data.ticket_id,
				attachment_ids: attachmentIDs,
			};
			await agentService.updateCommetIDs(updateAttachmentIDs);
			res.send(createResponse(result, "Resolution added successfully"));
		});
	} catch (error) {
		console.error('Transaction error:', error);
		await session.abortTransaction();
		res.status(400).send(createErrorResponse(400, "Something failed to create"));
	} finally {
		session.endSession();
	}
});

export const Ticketincomplete = asyncHandler(async (req: Request, res: Response) => {
	const session = await mongoose.startSession();
	try {
		await session.withTransaction(async () => {
			const data = req.body;
			const user = (req as any).user;
			const UserId = user._id;

			const resolutionData = {
				ticket: data.ticket_id,
				comment_text: data.comment_text,
				creator: UserId,
				IsAgentTicketEdit:true
			};

			const result = await agentService.Ticketincomplete(resolutionData);
			if (!result) {
				throw new Error("Failed to submit resolution.");
			}

			const files = req.files as Express.Multer.File[];
			const imageUrls = files.map(file => `${process.env.APP_URL}/images/miscellaneous/${file.filename}`);
			const fileTypes = files.map(file => file.mimetype);

			const attachments = files.map((file, index) => ({
				ticket: data.ticket_id,
				file_url: imageUrls[index],
				file_type: fileTypes[index]
			}));

			const savedAttachments = await CreateAttachments(attachments);
			const attachmentIDs = savedAttachments.map(att => att._id);

			let ticket = await agentService.getTicketByID(data.ticket_id);
			let creatorID = ticket?.creator;
			const ticketNumber = ticket?.ticket_number;
			const pushNotification = {
				creatorID: creatorID,
				userId: UserId,
				title: 'Ticket In-Complete',
				userNotification: `Ticket Number: #${ticketNumber} — More information is required for Resolution.`,
				agentNotification: `Ticket Number: #${ticketNumber} — Incomplete ticket request sent.`,
				notificationType: 'other',
			};
			await sendNotifications(pushNotification);

			

			// Audit log
			const AuditLog = await CreateAuditLog({
				ticket: data.ticket_id,
				creator: UserId,
				action: "Ticket is marked as Incomplete."
			}, session);

			await agentService.updateAuditLog(data.ticket_id, String(AuditLog._id));
			const updateAttachmentIDs = {
				commentId: result._id,
				ticketId: data.ticket_id,
				attachment_ids: attachmentIDs,
			};

			await agentService.updateCommetIDs(updateAttachmentIDs);
			res.send(createResponse(result, "Comment added successfully"));
		});
	} catch (error) {
		console.error('Transaction error:', error);
		res.status(400).send(createErrorResponse(400, "Something failed to create"));
	} finally {
		session.endSession();
	}
});




export const getUserCommentByTicketId= asyncHandler(async (req:Request,res:Response)=>{
		let ticketId=req.params.id;
		let result = await agentService.getUserCommentsByTicketId(ticketId);
		let comments=  result[0];	
		if(!result){
			res.send(createEmptyResponse());			
		}
	res.send(createResponse(comments,'Data Loaded'))
});


export const AddResovedPost = asyncHandler(
	async (req: Request, res: Response) => {
		const session = await mongoose.startSession();
		session.startTransaction();

		try {
			const { ticket_id, resolvedPostId, resolvedPostsComment } = req.body;
			const data = {
				ticket_id,
				resolvedPostId,
				resolvedPostsComment
			};

			const user = (req as any).user;
			const UserId = user._id;

			const result = await agentService.AddResovedPost(data);
			if (!result) {
				await session.abortTransaction();
				session.endSession();
				res.send(createErrorResponse(422, 'Failed to create'));
			}

			// Push Notification
			const creatorID = (result as any).creator;
			const ticketNumber = (result as any).ticket_number;
			const pushNotification = {
				creatorID: creatorID,
				userId: UserId,
				title: 'Ticket Resoved',
				userNotification: `Ticket Number: #${ticketNumber} — Ticket has been forecefully resolved by the Agent.`,
				agentNotification: `Ticket Number: #${ticketNumber} — Ticket has been resolved forcefully.`,
				notificationType: 'other',
			};
			
			const AuditLog = await CreateAuditLog(
				{
					ticket: ticket_id,
					creator: UserId,
					action: 'Ticket has been forecefully resolved by the Agent.',
				},
				session
			);

			await agentService.updateAuditLog(ticket_id, String(AuditLog._id));
			await sendNotifications(pushNotification);
			await session.commitTransaction();
			session.endSession();

			res.send(createResponse([],'Ticket has been resolved.'));
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			console.error(error);
			res.status(500).send(createErrorResponse(500, 'Internal Server Error'));
		}
	}
);


export const requestReassignTicket = asyncHandler(
	async (req: Request, res: Response) => {
		const session = await mongoose.startSession();
		session.startTransaction();
		try {
			const { ticket_id, AgentreAssign, AgentreAssignComment } = req.body;
			if (!Array.isArray(ticket_id) || ticket_id.length === 0) {
				res.status(422).send(createErrorResponse(422, 'Invalid ticket IDs'));
				return;
			}

			const data = {
				ticket_id,
				AgentreAssign,
				AgentreAssignComment
			};

			const user = (req as any).user;
			const UserId = user._id;

			// Update the tickets
			const result = await agentService.requestReAssign(data);
			if (!result || result.modifiedCount !== ticket_id.length) {
				await session.abortTransaction();
				session.endSession();
				res.send(createErrorResponse(422, 'Failed to create'));
				return;
			}

			for (const ticketId of ticket_id) {
				const ticket = await agentService.getTicketByID(ticketId);  
				if (ticket) {
					const creatorID = ticket.creator;
					const ticketNumber = ticket.ticket_number;
					
					// Create audit log
					const AuditLog = await CreateAuditLog(
						{
							ticket: ticketId,
							creator: UserId,
							action: 'Ticket has been requested for re-assign.',
						},
						session
					);
					await agentService.updateAuditLog(ticketId, String(AuditLog._id));
				}
			}

			await session.commitTransaction();
			session.endSession();

			res.send(createResponse([],'Requests have been sent.'));
		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			console.error(error);
			res.status(500).send(createErrorResponse(500, 'Internal Server Error'));
		}
	}
);



export const closedTicket = asyncHandler(
	async (req: Request, res: Response) => {
		const session = await mongoose.startSession();
		session.startTransaction();
		try {
			const { ticket_id } = req.body;
			const result = await agentService.clostTicket(ticket_id);

			if (!result) {
				await session.abortTransaction();
				session.endSession();
				 res.send(createErrorResponse(422, 'Failed to close ticket'));
			}

			const user = (req as any).user;
			const UserId = user._id;

			// Push Notification
			const creatorID = (result as any).creator;
			const ticketNumber = (result as any).ticket_number;
			const pushNotification = {
				creatorID: creatorID,
				userId: UserId,
				title: 'Ticket Closed',
				userNotification: `Ticket Number: #${ticketNumber} — Ticket has been closed.`,
				agentNotification: `Ticket Number: #${ticketNumber} — Ticket has been closed.`,
				notificationType: 'other',
			};
			await sendNotifications(pushNotification);


			// Audit log
			const AuditLog = await CreateAuditLog(
				{
					ticket: ticket_id,
					creator: UserId,
					action: 'Ticket has been closed.',
				},
				session
			);

			const updateAttachmentIDs = {
				auditlogId: AuditLog._id,
				ticketId: ticket_id,
			};

			await agentService.updateCommetIDs(updateAttachmentIDs);
			await session.commitTransaction();
			session.endSession();
			res.send(createResponse([],'Ticket has been closed.'));

		} catch (error) {

			await session.abortTransaction();
			session.endSession();
			console.error(error);
			res.status(500).send(createErrorResponse(500, 'Internal Server Error'));
		}
	}
);


export const GetAllTciketRequestAssign = asyncHandler(
	async (req: Request, res: Response) => {
		const user = (req as any).user;
		const UserId = user._id;
		const { status } = req.params;					
		if(status?.toLowerCase() =="pending") {
			const result = await agentService.getAllRequestReassign(UserId, status);
			if (!result || result.length === 0) {
				res.send(createEmptyResponse())
				return;
			}
			 res.send(createResponse(result, 'Data Loaded'));
			return;
		}
		const result = await agentService.getAllRequestReassign(UserId);
		if (!result || result.length === 0) {
			res.send(createEmptyResponse())
			return;
		}
		res.send(createResponse(result, 'Data Loaded'))
	}
);

export const getEscalatedTickets = asyncHandler(
	async (req: Request, res: Response) => {
		const user = (req as any).user;
		const UserId = user._id;
		// add multiple filter  for status, priority, category, assigned_to, created_at, updated_at
		const { status, priority, category, startDate, endDate  } = req.body;
		
		const statusArray = Array.isArray(status) ? status : [status];
		const priorityArray = Array.isArray(priority) ? priority : [priority];
		const categoryArray = Array.isArray(category) ? category : [category];
		
		const safeParseDate = (date: any) => {
			if (!date || date === 'null' || date === 'undefined') return null;
			const d = new Date(Array.isArray(date) ? date[0] : date);
			return isNaN(d.getTime()) ? null : d;
		};

		const parsedStartDate = safeParseDate(startDate);
		const parsedEndDate = safeParseDate(endDate);
		const data = {
			UserId: UserId,
			status: statusArray,
			priority: priorityArray,
			category: categoryArray,
			startDate: parsedStartDate,
			endDate: parsedEndDate,
			page: 1,
			limit: 10,
		}
		
		const result = await agentService.getEscalatedTickets(data);
		if (!result || result.length === 0) {
			res.send(createEmptyResponse())
			return;
		}
		res.send(createResponse(result, 'Data Loaded'));
	}
);

export const getEscalatedTicketsByID = asyncHandler(
	async (req: Request, res: Response) => {
		const ticket_id = req.params.id;		
		const data = {
			ticket_id: ticket_id,
		}
		const result = await agentService.getEscalatedTicketsByID(data);
		if (!result) {
			res.send(createEmptyResponse())
			return;
		}
		res.send(createResponse(result, 'Data Loaded'));
	}
);
export const getTicketsSlaStatus = asyncHandler(
	async (req: Request, res: Response) => {
		const user = (req as any).user;
		const UserId = user._id;
		const data = {
			UserId: UserId,
			page: 1,
			limit: 10,
		}
		const result = await agentService.getTicketsSlaStatus(data);
		if (!result || result.length === 0) {
			res.send(createEmptyResponse())
			return;
		}
		res.send(createResponse(result, 'Data Loaded'));
	}
);


export const getContactSupport = asyncHandler(
	async (req: Request, res: Response) => {
		const user = (req as any).user;
		const userId = user._id;
		const contactSupport = await contactSupportService.getContactSupportByUserId(userId);
		if (!contactSupport || contactSupport.length === 0) {
			res.send(createEmptyResponse());
			return;
		}
		res.send(createResponse(contactSupport,'Data Loaded'));
	}
);

export const createContactSupport = asyncHandler(
	async (req: Request, res: Response) => {
		const user = (req as any).user;
		const userId = user._id;
		const { message, calling_time , query_type } = req.body;
		if(calling_time != null && calling_time != undefined && calling_time != '' && calling_time != 'null'){
			const contactSupport = await contactSupportService.createContactSupport({message, contact_mode: 'call', calling_time, query_type, created_by: userId });
			if (!contactSupport) {
				res.send(createErrorResponse(400, 'Failed to create contact support'));
				return;
			}
		}else{
			const contactSupport = await contactSupportService.createContactSupport({message, contact_mode: 'email', query_type, created_by: userId });
			if (!contactSupport) {
				res.send(createErrorResponse(400, 'Failed to create contact support'));
				return;
			}
		}
	
		res.send(createResponse([],'Your request has been sent to the support team'));
	}	
);



export const getTicketCountByWeek = asyncHandler(
	async (req: Request, res: Response) => {
		const user = (req as any).user;
		const UserId = user._id;
		const data = {
			UserId: UserId,
			page: 1,
			limit: 10,
		}
		const result = await agentService.getTicketCountByWeek(data);
		if (!result || Object.keys(result).length === 0) {
			res.send(createEmptyResponse())
			return;
		}
		res.send(createResponse(result, 'Data Loaded'));
	}
);
	

export const slaKnowledgeBase = asyncHandler(
	async (req: Request, res: Response) => {
		const result = await agentService.slaKnowledgeBase();
		if (!result || result.length === 0) {
			res.send(createEmptyResponse())
			return;
		}
		res.send(createResponse(result, 'Data Loaded'));
	}
);




