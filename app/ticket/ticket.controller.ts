import { Request, Response } from 'express'
import mongoose from 'mongoose';
import asyncHandler from 'express-async-handler'
import * as ticketService from './ticket.service'
import { createResponse, createErrorResponse, createEmptyResponse, } from '../common/helper/response.helper'
import { CreateAttachments,deleteAttachment } from '../attachments/attachment.service'
import { CreateAuditLog } from '../auditlog/auditLog.service'
import * as Esclation from '../esclation/esclation.service'
import * as sla from '../sla/sla.service'
import * as  Status from '../admin/status/status.service'
import * as priorityService from '../admin/priority/priority.service'
import * as categoriesService from '../admin/categories/categories.service'
import * as resolvedPost from '../admin/resolvedPosts/resolvedPost.service'
import * as reAssignService from '../admin/reassignments/reAssignmentsOptions.service'
import * as userService from '../user/user.service'
import { sendNotifications } from '../common/services/push-notification.service';
import * as feedbackService from '../feedBack/feedback.service'
import * as feedbackServiceOptions from '../admin/feedbackOptions/feedbackOptions.service'
import * as rolesService from '../admin/roles/roles.service'
import * as levelService from '../admin/level/level.service'
import * as announcementsService from '../admin/announcements/announcements.service'
import * as contactSupportService from '../admin/contactSupport/contactSupport.service'
import * as contactSupportOptionsService from '../admin/contactSupportOptions/contactSupportOptions.service'



export const TicketsChartsCounts = asyncHandler(
	async (req: Request, res: Response) => {
		const user = (req as any).user;
		const UserId = user._id

		const result = await ticketService.getTicketCount(UserId, user.role);
		if (!result) {
			res.send(createEmptyResponse())
		}
		res.send(createResponse(result, "Data Loaded"))
	}
)

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
		const result = await ticketService.getTicketsCharts(data);
		if (!result) {
			res.send(createEmptyResponse())
			return;
		}
		res.json(createResponse(result, 'Data Loaded'));
	}
);


export const ticketDropdowns = async (req: Request, res: Response) => {
		const status = await Status.getAllStatus();
		const priorities = await priorityService.getAllPriorities();
		const categories = await categoriesService.getAllCategories();
		const AdminUsers = await userService.getAlluser();
		const roles = await rolesService.getAllRoles();
		const resolvedPostList = await resolvedPost.GetResolvedPost();
		const reassignOptions = await reAssignService.GetReAssignmentOptions();
		const feedbackOptions = await feedbackServiceOptions.GetFeedbackOptions();
		const levelList = await levelService.getAllLevels();
		const contactSupportOptions = await contactSupportOptionsService.getContactSupportOptionsByStatus(true);
		res.send({ status: 200, success: true, message: "Data loaded", data: { status, priorities,roles,levelList ,categories, resolvedPostList, reassignOptions, AdminUsers,feedbackOptions,contactSupportOptions } })
}


export const getAnnouncements = asyncHandler(
	async (req: Request, res: Response) => {
		const result = await announcementsService.getAnnouncementByStatus(true);
		if (!result || !result.length) {
			res.send(createEmptyResponse())
			return;
		}
		res.send(createResponse(result, 'Data Loaded'));
	}
);

export const createTicket = asyncHandler(async (req: Request, res: Response) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const user = (req as any).user;
		if (!user) {
			throw new Error("Unauthorized access");
		}

		const userId = user._id;
		req.body.creator = userId;
		const result = await ticketService.createTicket(req.body, session);
		if (!result) {
			res.send(createErrorResponse(500, "Failed to create ticket"));
		}
		
		const ticketID = (result as any)._id;
		await ticketService.addViewCommentStatus(ticketID);
		const ticketNumber = (result as any).ticket_number;
		const files = req.files as Express.Multer.File[];
		const attachments = files.map(file => ({
			ticket: ticketID,
			file_url: `${process.env.APP_URL}/images/miscellaneous/${file.filename}`,
			file_type: file.mimetype
		}));

		// SLA Calculation
		const slaResult = await slaTime(req.body.priority,ticketID);
		if (!slaResult) {
			res.send(createErrorResponse(500, "Failed to create SLA"));
		}

		// Escalation Processing
		const escalationData = {
			category_id: req.body.category,
			slaResult,
			ticket_id: ticketID,
			session
		};
		const escalationResult = await escalations(escalationData);
		if (!escalationResult) {
			res.send(createErrorResponse(500, "Failed to create"));
		}
		
		const escalation = await Esclation.createEscalation(escalationResult, session);
		const slaData = await sla.createSLA(slaResult, session);
		const savedAttachments = await CreateAttachments(attachments);
		const auditLog = await CreateAuditLog({ ticket: ticketID, creator: userId, action: "Ticket Raised" }, session);
		await ticketService.UpdateTicketAtt(ticketID, savedAttachments.map(att => att._id), auditLog._id, (slaData as any)._id, (escalation as any)._id, session);
		
		// Push Notification 
		const AgentID= escalationResult?.assigned_to
		const PrioritiesResults = await priorityService.getPriorityByID(req.body.priority);
		const PrirotyName = PrioritiesResults?.name || "Low";
		const pushNotification= {
			creatorID: userId,
			userId: AgentID,
			title: 'New Ticket',
			userNotification: `Ticket Number: #${ticketNumber} has been created.`,
			agentNotification: `Ticket Number #${ticketNumber} : A new ticket is assigned Priority:${PrirotyName}.`,
			notificationType: 'transaction',
		}
		await sendNotifications(pushNotification);		
		await session.commitTransaction();
		res.send(createResponse(result, "Ticket created successfully"));
	} catch (error: any) {
		await session.abortTransaction();
		res.status(500).send(createErrorResponse(500, error.message));
	} finally {
		session.endSession();
	}
});

const slaTime = async (priority: any,ticket_id: any) => {
	const result = await priorityService.getPriorityByID(priority);
	if (!result) return null;
	const slaData = {
		priority,
		response_time: { LOW: 8, MEDIUM: 6, HIGH: 6, CRITICAL: 2 }[result.name],
		resolution_time: result.esclationHrs,
		breach_action: "",
		status: "Active",
		created_at: new Date(),
		ticket_id: ticket_id
	};

	return slaData;
};

const escalations = async (data: any) => {
	const category = await categoriesService.getAllCategoriesByCategoryId(data.category_id);
	if (!category) throw new Error("No category found");
	const assigned_to = await userService.getUserByLevel({level: (category as any).levels[0]?.name,categoryID: data.category_id});
	if (!assigned_to) throw new Error("No user found");
	return {
		category_id: data.category_id,
		assigned_to: assigned_to._id,
		level_of_user: assigned_to.level,
		status: "Active",
		escalation_time: convertHoursToDate(data.slaResult.resolution_time),
		escalation_reason: null,
		ticket_id: data.ticket_id
		
	};
};


const convertHoursToDate = (hours: number) => {
	const now = new Date();
	now.setHours(now.getHours() + hours);
	return now.toISOString();
};


export const getTicketUpdate = asyncHandler(
	async (req: Request, res: Response) => {
		const ticket = await ticketService.getTicketDetails(req.params.id)
		if (!ticket) {
			res.send(createEmptyResponse())
		}
		res.send(createResponse(ticket, "Ticket details loaded"))
	}

)

export const updateTicket = asyncHandler(async (req: Request, res: Response) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const user = (req as any).user;
		const userId = user._id;
		const ticketID = req.params.id;

		if (!mongoose.Types.ObjectId.isValid(ticketID)) {
			res.send(createErrorResponse(404, "Invalid Ticket ID!"));
			return;
		}

		const currentTicket = await ticketService.getTicketById(ticketID, session);
		if (!currentTicket) {
			res.send(createErrorResponse(404, "Ticket not found!"));
			return;
		}

		const updatedTicket = await ticketService.updateTicketValue(ticketID, req.body, session, currentTicket.__v);
		const ticketNumber = updatedTicket.ticket_number;

		if (!updatedTicket) {
			res.send(createErrorResponse(500, "Failed to update ticket!"));
			return;
		}

		await session.commitTransaction();
		const files = req.files as Express.Multer.File[];
		if (files && files.length > 0) {
			const attachments = files.map(file => ({
				ticket: updatedTicket._id,
				file_url: `${process.env.APP_URL}/images/miscellaneous/${file.filename}`,
				file_type: file.mimetype
			}));

			const savedAttachments = await CreateAttachments(attachments);
			await ticketService.UpdateTicketAtt(updatedTicket._id, savedAttachments.map(att => att._id));
		}

		const userData = await userService.getUserById(req.body.assigned_to);
		if (!userData) {
			res.send(createEmptyResponse());
			return;
		}
		
		const auditLog = await CreateAuditLog({ ticket: ticketID, creator: userId, action: "Ticket Updated" }, session);
		if (req.body.assigned_to && req.body.assigned_to !== (currentTicket as any).assigned_to) {
			let escalate = await Esclation.createEscalation({
				category_id: req.body.category,
				assigned_to: req.body.assigned_to,
				level_of_user: userData.level,
				status: "Active",
				escalation_time: new Date(),
				escalation_reason: null
			});
			let esclationID = escalate._id;

			let pushEsclation = {
				ticketId: updatedTicket._id,
				esclationId: esclationID,
				auditLog: auditLog._id,
			}
			await ticketService.pushIdTicket(pushEsclation, session);
		}

		res.send(createResponse(updatedTicket, "Ticket updated successfully"));
	} catch (error: any) {
		console.error("Update Ticket Error:", error);
		if (session.inTransaction()) {
			await session.abortTransaction();
		}
		res.send(createErrorResponse(500, error.message));
	} finally {
		session.endSession();
	}
});




export const getAllTickets = asyncHandler(
	async (req: Request, res: Response) => {
		const user = (req as any).user;
		const UserId = user._id
		const result = await ticketService.getAllTickets(UserId, user.role);
		if (!result) {
			res.send(createEmptyResponse())
		}
		if (req.params.status) {
			let data = {
				status: req.params.status,
				UserId: UserId,
				role: user.role,
				page: 1,
				limit: 10,
			};
			let tickets = await ticketService.getTicketDetailsByStatus(data);
			if (!tickets.length) {
				res.send(createEmptyResponse())
				return;
			}
			res.send(createResponse(tickets, "Data Loaded"));
			return;
		}
		res.send(createResponse(result))
	}
)

export const getTicketDetails = asyncHandler(
	async (req: Request, res: Response) => {
		const result = await ticketService.getTicketDetails(req.params.id)
		if (!result.length) {
			res.send(createEmptyResponse())
		}
		const ticket = Array.isArray(result) ? result[0] : result;

		res.send(createResponse(ticket, "Data Loaded"))
	}
)

export const getTicketStatusCount = asyncHandler(
	async (req: Request, res: Response) => {
		const user = (req as any).user;
		const UserId = user._id;
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 10;
		let result = await ticketService.getTicketCount(UserId, user.role);
		const { fromDate, todate } = req.query;

		let TicketStatus = result.data.map(({ status, count, icons }) => ({
			status,
			count,
			icon: icons.length > 0 ? icons[0].icon : null
		}));
		if (req.params.status) {
			let data = {
				fromDate,
				todate,
				status: req.params.status,
				UserId: UserId,
				page: 1,
				limit: 10,
			};
			let tickets = await ticketService.getTicketDetailsByStatus(data);
			res.send(createResponse(tickets, "Data Loaded"));
			return;
		}
		res.send(createResponse(TicketStatus, "Data Loaded"));
	}
);


export const addComment = asyncHandler(async (req: Request, res: Response) => {
	let data = req.body;
	const user = (req as any).user;
	const UserId = user._id;
	data.creator = UserId;

	const result = await ticketService.createComment(data);
	if (!result) {
		 res.status(400).send(createErrorResponse(400, "Failed to add comment"));
		return;
	}

	const files = req.files as Express.Multer.File[] || [];
	const imageUrls = files.map(file => `${process.env.APP_URL}/images/miscellaneous/${file.filename}`);
	const fileTypes = files.map(file => file.mimetype);

	const commentId = result._id;
	const attachments = files.map((file, index) => ({
		ticket: data.ticket,
		file_url: imageUrls[index],
		file_type: fileTypes[index],
	}));

	let savedAttachments = [];
	let attachmentIDs = [];
	if (attachments.length > 0) {
		savedAttachments = await CreateAttachments(attachments);
		attachmentIDs = savedAttachments.map(att => att._id);
		await ticketService.updateCommetIDs({
			commentId: commentId,
			ticketId: data.ticket,
			attachment_ids: attachmentIDs,
		});
	}

	const ticketResult = await ticketService.getTicketById(data.ticket);
	const ticketNumber = (ticketResult as any).ticket_number;
	const escalationArray = (ticketResult as any).esclation || [];
	const lastEscalationId = escalationArray.at(-1);
	if (lastEscalationId) {
		const AgentResult = await Esclation.getEscalationById(lastEscalationId);
		const AgentID = (AgentResult as any).assigned_to || null;
		if (AgentID) {
			const pushNotification = {
				creatorID: UserId,
				userId: AgentID,
				title: 'Resolution Denied',
				userNotification: `Ticket Number: #${ticketNumber} — You have denied the resolution.`,
				agentNotification: `Ticket Number: #${ticketNumber} —The resolution was denied by the user.`,
				notificationType: 'other',
			};
			await sendNotifications(pushNotification);
		}
	}
	// create audit log
	const auditLog = await CreateAuditLog({ ticket: data.ticket, creator: UserId, action: "Comment added by customer." });
	const auditId = auditLog._id;
	await ticketService.updateAuditLog(data.ticket, auditId);
	res.send(createResponse(result, "Comment added successfully"));
	return;
});


  export const addFeedback= asyncHandler(
	async (req:Request,res:Response)=>{
		  const { ticket, rating, comment, feedbackOptions } =req.body
		  const user =req.user
		  const creator =(user as any)._id
		  const ticketDetails = await ticketService.getTicketById(ticket)
		  const ticketNumber = (ticketDetails as any)?.ticket_number
		  const esclationId = (ticketDetails as any)?.esclation?.map((esclation: any) => esclation) || [];		  
		  const esclationDetails = await Esclation.getEscalationById(esclationId)	
		  const assigned_to = (esclationDetails as any)?.assigned_to || null	  
		  const data={
			ticket,
			rating,
			comment,
			creator,
			feedbackfor:assigned_to,
			feedbackOptions: feedbackOptions,
		  }
		const response = await feedbackService.AddFeedback(data);
		if(!response){
			res.send(createErrorResponse(500,'Something went wrong!Please try again later.'))
		}

		
		// send notification to agent
		const pushNotification = {
			creatorID: creator,
			userId: assigned_to,
			title: 'Feedback Added',
			userNotification: `Ticket Number: #${ticketNumber} — You have been provided feedback.`,
			agentNotification: `Ticket Number: #${ticketNumber} — A customer has been provided feedback.`,
			notificationType: 'other',
		}
		await sendNotifications(pushNotification);

		// create audit log
		  const auditLog = await CreateAuditLog({ ticket: ticket, creator: creator, action: "Feedback added." }, null);
		  const auditId = auditLog._id;
		  await ticketService.updateAuditLog(ticket, auditId);			
		await ticketService.updateTicketSkipFeedback(ticket)
		res.send(createResponse(response,'Feedback has been added.'))
	}
  );


export const getSkipFeedbacks = asyncHandler(
	async (req:Request,res:Response)=>{
		const userId = (req as any).user._id
		const response = await ticketService.pendingTicketsForFeedback(userId)
		if(!response.length){
			res.send(createEmptyResponse())
			return;
		}
		res.send(createResponse(response,'Data Loaded'))
	}
  )

 



// Admin Features=================================================



export const getTicketStatusCountByAdmin = asyncHandler(
	async (req: Request, res: Response) => {
		const { startDate, endDate } = req.body;
		let filter = {
			startDate: startDate,
			endDate: endDate,
		}
		const result = await ticketService.getTicketCountByAdmin(filter);
		if (!result) {
			res.send(createEmptyResponse())
		}
		res.send(createResponse(result, "Data Loaded"))
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
		const result = await ticketService.getTicketCategoryCount(filter);
		if (!result) {
			res.send(createEmptyResponse());
			return;
		}
		res.send(createResponse(result, "Data Loaded"));
	}
);

export const TicketFilter = asyncHandler(async (req: Request, res: Response) => {
	const user = (req as any).user;
	const UserId = user._id;
	const role = user.role
	const {category, startDate, endDate, priority, assigned_to, status, page = 1, limit = 10} = req.body;

	if (!category && !startDate && !endDate && !priority && !assigned_to && !status) {
		const tickets = await ticketService.getAllTickets(UserId, user.role);
		if (!tickets.length) {
			res.send(createEmptyResponse());
			return;
		}
		res.send(createResponse(tickets, "Data Loaded"));
		return;
	}

	const filterData = {
		category,
		startDate,
		endDate,
		role,
		UserId,
		priority,
		assigned_to,
		status,
		page,
		limit,
	};

	Object.keys(filterData).forEach((key) => {
		const typedKey = key as keyof typeof filterData;
		if (filterData[typedKey] == null) {
			delete filterData[typedKey];
		}
	});

	let tickets;
	if (category) {
		tickets = await ticketService.getTicketDetailsByCategory(filterData);
	} else if (startDate || endDate) {
		tickets = await ticketService.getTicketByDateRange(filterData);
	} else if (status) {
		tickets = await ticketService.getTicketDetailsByStatus(filterData);
	} else if (priority) {
		tickets = await ticketService.getTicketDetailsByPriority(filterData);
	}

	if (!tickets || !tickets.length) {
		res.send(createEmptyResponse());
		return;
	}

	res.send(createResponse(tickets, "Data Loaded"));
	return
});

export const ticketUpdate = asyncHandler(
	async (req: Request, res: Response) => {
		const session = await mongoose.startSession();
		session.startTransaction();

		try {
			const user = (req as any).user;
			const { ticket_id, attachment_id, description } = req.body;
			const data = {
				_id: ticket_id,
				attachment_id,
				description,
				IsAgentTicketEdit: false,
				isAgentResolvedButtonShow: false,
			};

			const userId = user._id;
			req.body.creator = userId;

			const files = req.files as Express.Multer.File[] || [];
			const attachments = files.map((file) => ({
				ticket: ticket_id,
				file_url: `${process.env.APP_URL}/images/miscellaneous/${file.filename}`,
				file_type: file.mimetype,
			}));

			const savedAttachments = await CreateAttachments(attachments);
			const auditLog = await CreateAuditLog(
				{ ticket: ticket_id, creator: userId, action: "Ticket Updated" },
				session
			);

			const attachments_id = savedAttachments.map((att) => att._id);

			const PushTicketId = {
				ticketId: ticket_id,
				attachments_id,
				auditLog: auditLog?._id,
			};

			await ticketService.pushIdTicket(PushTicketId, session);
			const ticket = await ticketService.ticketUpdate(data, session);
			if (!ticket) {
				await session.abortTransaction();
				session.endSession();
				res.send(createResponse(null, "Ticket not found"));
				return;
			}
			
			await session.commitTransaction();
			session.endSession();
			res.send(createResponse(ticket, "Ticket updated successfully"));
			try {
				const ticketNumber = (ticket as any)?.ticket_number;
				const escalationArray = (ticket as any)?.esclation || [];
				const lastEscalationId = escalationArray[escalationArray.length - 1];
				if (lastEscalationId) {
					const AgentResult = await Esclation.getEscalationById(lastEscalationId);
					const AgentID = (AgentResult as any)?.assigned_to || null;

					if (AgentID) {
						const pushNotification = {
							creatorID: userId,
							userId: AgentID,
							title: 'Ticket Update',
							userNotification: `Ticket Number: #${ticketNumber}: Your update has been sent to the agent.`,
							agentNotification: `Ticket Number #${ticketNumber} : The user has updated the ticket.`,
							notificationType: 'transaction',
						};
						await sendNotifications(pushNotification);
					}
				}
			} catch (notificationErr) {
				console.error("Push notification failed:", notificationErr);
				
			}

		} catch (error: any) {
			await session.abortTransaction();
			session.endSession();
			res.status(500).send(createErrorResponse(500, error.message));
		}
	}
);



export const removeAttachmentFromTicket = asyncHandler(
	async (req: Request, res: Response) => {
		const { ticket_id, attachment_id } = req.body;
		const session = await mongoose.startSession();
		session.startTransaction();
		try {
			
				await deleteAttachment(attachment_id, session);
				await ticketService.removeAttachmentFromTicket(
					ticket_id,
					attachment_id,
					session
				);
			
			await session.commitTransaction();
			session.endSession();
			res.send(createResponse([], "Attachment removed successfully"));

		} catch (error) {
			await session.abortTransaction();
			session.endSession();
			res.status(500).json({ message: "Failed to remove attachment", error });
		}
	}
);



export const  isTicketResolved= asyncHandler(
	async (req: Request, res: Response) => {
		const { ticket_id } = req.body;
		const user = (req as any).user;
		const userId = user._id;
		if (!ticket_id) {
			res.send(createErrorResponse(400, "Ticket ID is required"));
			return;
		}
		const session = await mongoose.startSession();
		session.startTransaction();
		try {
			const ticket = await ticketService.isTicketResolved(ticket_id, session);
			if (ticket) {
				await session.commitTransaction();
				session.endSession();
				res.send(createResponse(ticket, "Ticket resolved successfully"));
			}

			const auditLog = await CreateAuditLog({ ticket: ticket_id, creator: userId, action: "Ticket Resolved by Customer." }, null);
			const auditId = auditLog._id;
			await ticketService.updateAuditLog(ticket_id, auditId);

			// push notification
			const ticketNumber = (ticket as any)?.ticket_number;
			const escalationArray = (ticket as any)?.esclation || [];
			const lastEscalationId = escalationArray[escalationArray.length - 1];			
			if (lastEscalationId) {
				const AgentResult = await Esclation.getEscalationById(lastEscalationId);
				const AgentID = (AgentResult as any)?.assigned_to || null;
				if (AgentID) {
					const pushNotification = {
						creatorID: userId,
						userId: AgentID,
						title: 'Ticket Resolved',
						userNotification: `Ticket Number: #${ticketNumber}: The ticket has been resolved.`,
						agentNotification: `Ticket Number #${ticketNumber} : The ticket has been resolved.`,
						notificationType: 'transaction',
					};
					await sendNotifications(pushNotification);
				}
			}

		}catch(error){
			await session.abortTransaction();
			session.endSession();
			res.status(500).json({ message: "Failed to remove attachment", error });
		}	
});



export const createContactSupport = asyncHandler(
	async (req: Request, res: Response) => {
		const user = (req as any).user;	
		const userId = user._id;
		const { contact_number, message, calling_time } = req.body;
		const contactSupport = await contactSupportService.createContactSupport({ contact_number, message, calling_time, created_by: userId });
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
		if (!contactSupport || contactSupport.length === 0) {
			res.send(createEmptyResponse());
			return;
		}
		res.send(createResponse(contactSupport));
	}
);


