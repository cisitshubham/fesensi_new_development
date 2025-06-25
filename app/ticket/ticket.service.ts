import { ITicket } from './ticket.dto'
import { Ticket } from '../common/models/ticket.model'
import { DashboardIcon } from '../common/models/dashboard-icon.model'
import { TicketViewCommentStatus } from '../common/models/ticketViewcommentStatus'
import { Comment } from '../common/models/comment.model'
import { getAllCategories } from '../admin/categories/categories.service'
import { getAllStatus } from '../admin/status/status.service'
import {getCategoryCounts,getTicketCountByPiority,getTicketsByDateRange} from '../common/helper/tickets.helper'
import mongoose from 'mongoose';
import { formatTime } from '../common/helper/formatTIme';
export const createTicket = async (data: ITicket, session: any) => {
	let ticket_number = Number(await getNextTicketNumber());
	const result = await Ticket.create([{ ...data, ticket_number }], { session });
	return result[0];

}


export const addViewCommentStatus = async (ticket_id:string) =>{
	TicketViewCommentStatus.create({
		 ticket: ticket_id ,
		 agent_viewed: false,
		 customer_viewed: false, 
		 updated_at: new Date(),
		 upsert: true 
	})
}

export const getNextTicketNumber = async (): Promise<number> => {
	const lastTicket = await Ticket.findOne()
		.sort({ ticket_number: -1 })
		.collation({ locale: "en", numericOrdering: true })
		.select("ticket_number")
		.lean();
	if (!lastTicket) return 1;
	const nextNumber = Number(lastTicket.ticket_number) + 1;
	return nextNumber;
};


export const getTicketsCharts = async (data: any) => {
	const { UserId, fromDate, todate } = data;
	const statusCounts: Record<string, number> = {};
	const statusList = await getAllStatus();
	const startDate = new Date(fromDate);
	const endDate = new Date(todate);
	endDate.setHours(23, 59, 59, 999);
	const query: any = {
		creator: UserId,
	};
	if (fromDate && todate) {
		query.createdAt = { $gte: startDate, $lte: endDate };
	}
	

	const tickets = await Ticket.find(query)
		.select('_id status esclation category createdAt')
		.populate({ path: 'esclation', populate: { path: 'assigned_to', select: '_id' }, options: { lean: true } })
		.populate({ path: 'category', select: 'title', options: { lean: true } })
		.populate({ path: 'priority', select: 'name', options: { lean: true } }).lean();

	for (const status of statusList) {
		const count = tickets.filter(ticket => ticket.status === status.name).length;
		statusCounts[status.name] = count;
	}
	const categoryCounts = await getCategoryCounts(tickets);
	const priorityCounts = await getTicketCountByPiority(tickets);
	const currentDateCounts = await getTicketsByDateRange(tickets, fromDate, todate);
	const ticketProgression = await TicketProgression(data);
	return {
		statusCharts: statusCounts,
		categoryCharts: categoryCounts,
		priorityCharts: priorityCounts,
		ticketsbyVolume: currentDateCounts,
		TicketsByCategory: ticketProgression,
	};
};


export const TicketProgression = async (data?: any) => {
	const categories = await getAllCategories();
	const now = new Date();

	// Parse and normalize input dates
	let fromDate = data?.fromDate ? new Date(data.fromDate) : null;
	let toDate = data?.todate ? new Date(data.todate) : null;

	if (fromDate) fromDate.setHours(0, 0, 0, 0);
	if (toDate) toDate.setHours(23, 59, 59, 999);

	// Month boundaries for fallback when no custom range provided
	const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const endOfLastMonth = new Date(startOfCurrentMonth.getTime() - 1);
	endOfLastMonth.setHours(23, 59, 59, 999);

	const isCustomRange = !!(fromDate && toDate);
	const allowedStatuses = ['OPEN', 'RESOLVED', 'IN-PROGRESS'];

	const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

	// Helper: Calculate previous date range of same duration immediately before current range
	function getPreviousDateRange(from: Date, to: Date) {
		const durationMs = to.getTime() - from.getTime();
		const prevTo = new Date(from.getTime() - 1); // 1 ms before current start
		const prevFrom = new Date(prevTo.getTime() - durationMs);
		prevFrom.setHours(0, 0, 0, 0);
		prevTo.setHours(23, 59, 59, 999);
		return { prevFrom, prevTo };
	}

	// Calculate previous custom range if needed
	const prevRange = isCustomRange && fromDate && toDate ? getPreviousDateRange(fromDate, toDate) : null;

	let totalTicketCount = 0;
	let totalLastMonthCount = 0;

	const counts = await Promise.all(
		categories.map(async (category: any) => {
			const baseFilter: any = {
				category: category._id,
				creator: data?.UserId,
				status: { $in: allowedStatuses },
			};

			// Filter for current date range
			if (isCustomRange) {
				baseFilter.createdAt = { $gte: fromDate, $lte: toDate };
			} else {
				baseFilter.createdAt = { $gte: startOfCurrentMonth };
			}

			const tickets = await Ticket.find(baseFilter).lean();
			const ticketCount = tickets.length;
			totalTicketCount += ticketCount;

			let lastMonthCount = 0;
			if (isCustomRange && prevRange) {
				// Previous custom range filter
				const prevFilter = {
					category: category._id,
					creator: data?.UserId,
					status: { $in: allowedStatuses },
					createdAt: { $gte: prevRange.prevFrom, $lte: prevRange.prevTo },
				};
				lastMonthCount = await Ticket.countDocuments(prevFilter);
			} else if (!isCustomRange) {
				// Previous calendar month filter
				const lastMonthFilter = {
					category: category._id,
					creator: data?.UserId,
					status: { $in: allowedStatuses },
					createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
				};
				lastMonthCount = await Ticket.countDocuments(lastMonthFilter);
			}

			totalLastMonthCount += lastMonthCount;

			// Updated percentage change calculation with zero-case handling
			const percentageChange = (() => {
				if (ticketCount === 0 && lastMonthCount > 0) return -100;
				if (lastMonthCount === 0 && ticketCount > 0) return 100;
				if (ticketCount === 0 && lastMonthCount === 0) return 0;
				return ((ticketCount - lastMonthCount) / lastMonthCount) * 100;
			})();

			return {
				category: category.title,
				ticketCount,
				lastMonthCount,
				percentageChange: formatPercentage(percentageChange),
			};
		})
	);

	// Overall percentage change with same zero-case handling
	const overallPercentageChange = (() => {
		if (totalTicketCount === 0 && totalLastMonthCount > 0) return -100;
		if (totalLastMonthCount === 0 && totalTicketCount > 0) return 100;
		if (totalTicketCount === 0 && totalLastMonthCount === 0) return 0;
		return ((totalTicketCount - totalLastMonthCount) / totalLastMonthCount) * 100;
	})();

	return {
		overallPercentageChange: formatPercentage(overallPercentageChange),
		totalTicketCount,
		totalLastMonthCount,
		counts,
	};
};






export const UpdateTicketAtt = async (ticketID: any, attachmentIDs?: string[], auditLogID?: any, slaDataID?: any, escalation?: any, session?: any) => {
	const result = await Ticket.findByIdAndUpdate(
		ticketID,
		{
			$push: { attachments: { $each: attachmentIDs } },
			$set: { audit_log: auditLogID, sla: slaDataID, esclation: escalation }
		},
		{ new: true, session }
	);
};


export const pushIdTicket = async (data: any, session?: any) => {	
	const pushData: any = {
		audit_log: data.auditLog
	};

	if (data.esclationId) {
		pushData.esclation = data.esclationId;
	}

	if (data.attachments_id){
		pushData.attachments = { $each: data.attachments_id };
	}
	const result = await Ticket.findByIdAndUpdate(
		data.ticketId,
		{
			$push: pushData
		},
		{ new: true, session }
	);

	return result;
};

// update audit log
export const updateAuditLog = async (ticketId: any, auditId: any) => {
	
	const result = await Ticket.findByIdAndUpdate(
		ticketId,
		{ $push: { audit_log: auditId } },
		{ new: true } 
	);

	return result;
  };
  
  


export const updateTicketValue = async (ticketID: string, data: any, session: any, version: number) => {
	try {
		const updatedTicket = await Ticket.findOneAndUpdate(
			{ _id: ticketID, __v: version },
			{ ...data, $inc: { __v: 1 } },
			{
				session,
				new: true,
				runValidators: true,
				useFindAndModify: false,
				retryWrites: true
			}
		);

		if (!updatedTicket) {
			throw new Error("Ticket update failed: Possible concurrency issue");
		}

		return updatedTicket;
	} catch (error) {
		console.error("Error updating ticket:", error);
		throw error;
	}
};

export const getAllTickets = async (_id: any, role: string, page = 1, limit = 10, isAgentView = false) => {
	const skip = (page - 1) * limit;

	const query: any = {};
	if (!role || role !== "admin") {
		query.creator = _id;
	}

	const totalCount = await Ticket.countDocuments(query);
	const result = await Ticket.find(query)
		.select('_id ticket_number title description status priority createdAt')
		.populate({ path: 'category', select: 'title', options: { lean: true } })
		.populate({ path: 'priority', select: 'name', options: { lean: true } })
		.populate({
			path: 'esclation',
			options: { lean: true },
			populate: { path: 'assigned_to', select: 'first_name', options: { lean: true } }
		})
		.populate({
			path: 'comments',
			select: '_id comment_text creator createdAt',
			populate: {
				path: 'creator',
				select: 'first_name last_name role',
				populate: {
					path: 'role',
					select: 'role_name'
				}
			},
			options: { lean: true }
		})
		.populate({ path: 'sla', options: { lean: true } })
		.populate({ path: 'status', select: 'name', options: { lean: true } })
		.sort({ createdAt: -1 })
		.lean();

	for (const ticket of result) {
		if (ticket.status) {
			const iconData = await DashboardIcon.findOne({ name: ticket.status }).select('icon').lean();
			(ticket as any).icon = iconData?.icon || 'https://assistly.hostree.in/images/images/email-verified.png';
		}

		const agentCommentStatus = await TicketViewCommentStatus.findOne({
			ticket: ticket._id,
		}).lean();
		(ticket as any).isAgentCommented = agentCommentStatus?.customer_viewed === false ? false : true;
	}


	const transformedResult = result.map(ticket => {
		let dueDate = null;
		if (ticket.sla?.length) {
			const createdAt = new Date(ticket.createdAt);
			createdAt.setHours(createdAt.getHours() + (ticket.sla[0] as any).resolution_time);
			dueDate = createdAt.toLocaleDateString('en-GB', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
			});
		}

		const assignedUser = (ticket as any)?.esclation?.length
			? (ticket as any).esclation?.[(ticket as any).esclation?.length - 1]?.assigned_to?.first_name ?? null
			: null;

		return {
			_id: ticket._id ?? null,
			ticket_number: ticket.ticket_number ?? null,
			title: ticket.title ?? null,
			description: ticket.description ?? null,
			status: ticket.status ?? null,
			priority: ticket.priority ? (ticket.priority as any).name : null,
			category: ticket.category ? (ticket.category as any).title : null,
			assigned_to:  assignedUser || null,
			due_date: dueDate,
			createdAt: formatTime(ticket.createdAt),
			icon: (ticket as any).icon,
			isAgentCommented: (ticket as any).isAgentCommented,
		};
	});
	return transformedResult;
};

export const getTicketById = async (ticketID: string, session?: any) => {
	const ticket = await Ticket.findById(ticketID).session(session);
	return ticket;
}
export const getTicketDetails = async (id: string, page = 1, limit = 10) => {
	const skip = (page - 1) * limit;
	const totalCount = await Ticket.countDocuments({ _id: id });
	const result = await Ticket.find({ _id: id })
		.select('_id ticket_number title description status priority IsAgentTicketEdit isResolved createdAt')
		.populate({ path: 'category', select: 'title', options: { lean: true } })
		.populate({ path: 'priority', select: 'name', options: { lean: true } })
		.populate({
			path: 'esclation',
			options: { lean: true },
			populate: { path: 'assigned_to', select: 'first_name', options: { lean: true } }
		})
		.populate({
			path: 'comments',
			select: '_id comment_text createdAt creator attachments',
			populate: [
				{ path: 'attachments', select: 'file_url file_type' },
				{
					path: 'creator',
					select: 'first_name last_name role',
					populate: {
						path: 'role',
						select: 'role_name'
					}
				}
			],
			options: { lean: true }
		})
		.populate({ path: 'sla', options: { lean: true } })
		.populate('attachments', 'file_url file_type')
		.populate('audit_log')
		.lean();

	for (const ticket of result) {
		if (ticket.comments && Array.isArray(ticket.comments)) {
			const sortedComments = ticket.comments.sort((a, b) => new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime());

			const agentCommentStatus = await TicketViewCommentStatus.findOne({
				ticket: id,
			}).lean();
			
			const latestAgentComment = sortedComments.find(comment => {
				const roles = Array.isArray((comment as any)?.creator?.role) ? (comment as any).creator.role : [];
				return roles.some((r: { role_name: string }) => r.role_name?.toUpperCase() === 'AGENT');
			});
			
			
			(ticket as any).isAgentCommented = agentCommentStatus?.customer_viewed;
			if (latestAgentComment) {
				ticket.comments = [{
					_id: (latestAgentComment as any)._id,
					comment_text: (latestAgentComment as any).comment_text,
					createdAt: new Date((latestAgentComment as any).createdAt).toLocaleDateString('en-GB', {
						day: '2-digit',
						month: '2-digit',
						year: 'numeric',
					}),
					attachments: (latestAgentComment as any).attachments ?? [],
					creator_name: `${(latestAgentComment as any).creator?.first_name ?? ''} ${(latestAgentComment as any).creator?.last_name ?? ''}`.trim(),
					role: 'AGENT',
				}] as any[];
			} else {
				ticket.comments = [];
			}
		} else {
			(ticket as any).isAgentCommented = false;
		}
	}

	const transformedResult = result.map(ticket => {
		let dueDate = null;
		if (ticket.sla?.length) {
			const createdAt = new Date(ticket.createdAt);
			createdAt.setHours(createdAt.getHours() + (ticket.sla[0] as any).resolution_time);
			dueDate = createdAt.toLocaleDateString('en-GB', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
			});
		}

		const assignedUser = (ticket as any)?.esclation?.length
			? (ticket as any).esclation?.[(ticket as any).esclation?.length - 1]?.assigned_to?.first_name ?? null
			: null;

		return {
			_id: ticket._id ?? null,
			ticket_number: ticket.ticket_number ?? null,
			title: ticket.title ?? null,
			description: ticket.description ?? null,
			status: ticket.status ?? null,
			priority: ticket.priority ? (ticket.priority as any).name : null,
			category: ticket.category ? (ticket.category as any).title : null,
			assigned_to: assignedUser,
			due_date: dueDate,
			createdAt: formatTime(ticket.createdAt),
			isCustomerTicketEdit: ticket.IsAgentTicketEdit,
			isAgentCommented: (ticket as any).isAgentCommented,
			isResolved: (ticket as any).isResolved,
			latest_agent_comment: (ticket as any).comments[0] ?? null,
			attachments: ticket.attachments,
			audit_log: ticket.audit_log
		};
	});

	return transformedResult;
};


export const getTicketCount = async (userId: string, role: string) => {
	const statusMap: Record<string, string> = {
		"OPEN": "0",
		"IN-PROGRESS": "1",
		"RESOLVED": "2",
		"CLOSED": "3",
	};
	const statuses = Object.keys(statusMap);
	const query: any = {};
	if (!role || role !== 'admin') {
		query.creator = userId;
	}

	const counts = await Promise.all(
		statuses.map(async (status) => {
			const count = await Ticket.countDocuments({ ...query, status });
			const icons = await DashboardIcon.find({ name: status }).select("icon");

			return {
				status,
				count,
				icons
			};
		})
	);


	return { data: counts };
};


export const getTicketDetailsByStatus = async (data: any) => {

	const skip = (data.page - 1) * data.limit;
	const totalCount = await Ticket.countDocuments({ creator: data.UserId, status: data.status });
	const startDate = new Date(data.fromDate);
	const endDate = new Date(data.todate);
	startDate.setHours(0, 0, 0, 0);
	endDate.setHours(23, 59, 59, 999);
	const query: any = { status: data.status };
	if (!data.role || data.role !== 'admin') {
		query.creator = data.UserId;
	}
	if (data.fromDate && data.todate) {
		query.createdAt = { $gte: startDate, $lte: endDate };
	}


	const result = await Ticket.find(query)
		.select('_id ticket_number title description status priority createdAt')
		.populate({ path: 'category', select: 'title', options: { lean: true } })
		.populate({ path: 'priority', select: 'name', options: { lean: true } })
		.populate({
			path: 'esclation',
			options: { lean: true },
			populate: { path: 'assigned_to', select: 'first_name', options: { lean: true } }
		})
		.populate({ path: 'sla', options: { lean: true } })
		.populate({ path: 'status', select: 'name', options: { lean: true } })
		.sort({ createdAt: -1 })
		.lean();

	// .skip(skip)
	// .limit(limit);

	result.forEach((ticket, index) => {
		(ticket as any).sr_no = index + 1;
	});

	for (const ticket of result) {
		if (ticket.status) {
			const iconData = await DashboardIcon.findOne({ name: ticket.status }).select('icon').lean();
			(ticket as any).icon = iconData?.icon || 'https://assistly.hostree.in/images/images/email-verified.png';
		}
		const agentCommentStatus = await TicketViewCommentStatus.findOne({
			ticket: ticket._id,
		}).lean();
		(ticket as any).isAgentCommented = agentCommentStatus?.customer_viewed === false ? false : true;
	}
	const transformedResult = result.map(ticket => {
		let dueDate = null;
		if (ticket.sla?.length) {
			const createdAt = new Date(ticket.createdAt);
			createdAt.setHours(createdAt.getHours() + (ticket.sla[0] as any).resolution_time);
			dueDate = createdAt.toLocaleDateString('en-GB', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
			});
		}
		const assignedUser = (ticket as any)?.esclation?.length
			? (ticket as any).esclation?.[(ticket as any).esclation?.length - 1]?.assigned_to?.first_name ?? null
			: null;
		return {
			_id: ticket._id ?? null,
			ticket_number: ticket.ticket_number ?? null,
			title: ticket.title ?? null,
			description: ticket.description ?? null,
			status: ticket.status ?? null,
			priority: ticket.priority ? (ticket.priority as any).name : null,
			category: ticket.category ? (ticket.category as any).title : null,
			assigned_to: assignedUser,
			due_date: dueDate,
			createdAt: formatTime(ticket.createdAt),
			icon: (ticket as any).icon,
			isAgentCommented: (ticket as any).isAgentCommented
		};


	});
	// const pagination = {
	// 		currentPage: page,
	// 		totalPages: Math.ceil(totalCount / limit),
	// 			totalItems: totalCount,
	// 				hasNextPage: page * limit < totalCount,
	// 					hasPrevPage: page > 1,
	// 		},

	return transformedResult;


}

export const createComment = async (data: any) => {
	let result = await Comment.create(data);
	// updating button condtion if user update the resoulation check
	// resoulation button hide and and enable Agent view button
	await Ticket.findOneAndUpdate(
		{ _id: data.ticket },
		{ $push: { comments: result._id },
			$set: { isAgentResolvedButtonShow: true, isAgentViewButtonShow: true, isResolved:false }		
		},
		{ new: true }
	);
	await TicketViewCommentStatus.findOneAndUpdate(
		{ ticket: data.ticket }, 
		 { updated_at: new Date(),
		  customer_viewed:false,
		  agent_viewed:true
		},
		{ upsert: true }
	);
	return result;
};


// export const updateCommetIDs = async (data: any) => {
// 	let result = await Ticket.findByIdAndUpdate(
// 		data.ticketId,
// 		{
// 			$push: { attachments: { $each: data.attachment_ids } }
// 		},
// 		{ new: true }
// 	);
// 	return result;
// };

export const updateCommetIDs = async (data: any) => {
	let updateData: any = {};
	if (data.attachment_ids) {
		updateData.$push = {
			attachments: { $each: data.attachment_ids }
		};
	}
	if (data.commentId) {
		updateData.$push = {
			attachments: { $each: data.attachment_ids }
		};
		await Comment.findByIdAndUpdate(
			data.commentId,
			updateData,
			{ new: true }
		);
	}
	if (Object.keys(updateData).length === 0) {
		return null;
	}
	delete data.commentId;
	let result = await Ticket.findByIdAndUpdate(
		data.ticketId,
		updateData,
		{ new: true }
	);

	return result;
};


// Admin Start here -===================================================================================



export const getTicketCountByAdmin = async (data: any) => {
	const statusMap: Record<string, string> = {
		"IN-PROGRESS": "0",
		"OPEN": "1",
		"RESOLVED": "2",
	};

	const statuses = Object.keys(statusMap);
	const filter: any = { status: { $in: statuses } };
	if (data?.startDate || data?.endDate) {
		filter.createdAt = {};
		if (data.startDate) filter.createdAt.$gte = new Date(data.startDate);
		if (data.endDate) filter.createdAt.$lte = new Date(data.endDate);
	}

	const totalCount = await Ticket.countDocuments(filter);
	const counts = await Promise.all(
		statuses.map(async (status) => {
			const statusFilter = { ...filter, status };
			const count = await Ticket.countDocuments(statusFilter);
			return { status, count };
		})
	);
	const now = new Date();
	const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const endOfLastMonth = new Date(startOfCurrentMonth.getTime() - 1);
	const currentMonthCount = await Ticket.countDocuments({
		status: { $in: statuses },
		createdAt: { $gte: startOfCurrentMonth },
	});

	const lastMonthCount = await Ticket.countDocuments({
		status: { $in: statuses },
		createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
	});
	let percentageChange = 0;
	if (lastMonthCount > 0) {
		const change = ((currentMonthCount - lastMonthCount) / lastMonthCount) * 100;
		percentageChange = Math.max(0, change);
	}

	return {
		totalCount,
		percentageChange: percentageChange.toFixed(2) + "%",
		counts,
	};
};

export const getTicketCategoryCount = async (data?: any) => {
	const categories = await getAllCategories();

	const now = new Date();
	const fromDate = data?.startDate ? new Date(data.startDate) : null;
	const toDate = data?.endDate ? new Date(data.endDate) : null;

	const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const endOfLastMonth = new Date(startOfCurrentMonth.getTime() - 1);

	const isCustomRange = !!(fromDate || toDate);

	const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

	const counts = await Promise.all(
		categories.map(async (category: any) => {
			const filter: any = { category: category._id, 
								  creator: data.UserId			
								};

			if (isCustomRange) {
				filter.createdAt = {};
				if (fromDate) filter.createdAt.$gte = fromDate;
				if (toDate) filter.createdAt.$lte = toDate;
			} else {
				filter.createdAt = { $gte: startOfCurrentMonth };
			}

			const ticketCount = await Ticket.countDocuments(filter);

			let lastMonthCount = 0;
			if (!isCustomRange) {
				lastMonthCount = await Ticket.countDocuments({
					category: category._id,
					createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },

				});
			}

			const percentageChange =
				lastMonthCount > 0
					? Math.max(0, ((ticketCount - lastMonthCount) / lastMonthCount) * 100)
					: 0;

			return {
				category: category.title,
				ticketCount,
				lastMonthCount,
				percentageChange: formatPercentage(percentageChange),
			};
		})
	);

	const totalTicketCount = counts.reduce((sum, c) => sum + c.ticketCount, 0);
	const totalLastMonthCount = counts.reduce((sum, c) => sum + c.lastMonthCount, 0);

	const overallPercentageChange =
		totalLastMonthCount > 0
			? Math.max(0, ((totalTicketCount - totalLastMonthCount) / totalLastMonthCount) * 100)
			: 0;

	return {
		overallPercentageChange: formatPercentage(overallPercentageChange),
		totalTicketCount,
		totalLastMonthCount,
		counts,
	};
};



export const getTicketByDateRange = async (data: any) => {
	const { startDate, endDate } = data;

	const start = new Date(startDate);
	const end = new Date(endDate);

	if (isNaN(start.getTime()) || isNaN(end.getTime())) {
		throw new Error('Invalid startDate or endDate');
	}

	end.setHours(23, 59, 59, 999);
	const skip = (data.page - 1) * data.limit;
	const totalCount = await Ticket.countDocuments({
		createdAt: { $gte: start, $lte: end },
	});


	const result = await Ticket.find({
		createdAt: { $gte: start, $lte: end },
	})
		.select('_id ticket_number title description status priority createdAt')
		.populate({ path: 'category', select: 'title', options: { lean: true } })
		.populate({ path: 'priority', select: 'name', options: { lean: true } })
		.populate({
			path: 'esclation',
			options: { lean: true },
			populate: { path: 'assigned_to', select: 'first_name', options: { lean: true } },
		})
		.populate({ path: 'sla', options: { lean: true } })
		.populate({ path: 'status', select: 'name', options: { lean: true } })
		.skip(skip)
		.limit(data.limit)
		.lean();
	for (const ticket of result) {
		if (ticket.status) {
			const iconData = await DashboardIcon.findOne({ name: ticket.status }).select('icon').lean();
			(ticket as any).icon = iconData?.icon || 'https://assistly.hostree.in/images/images/email-verified.png';
		}
	}

	;
	const transformedResult = result.map(ticket => {
		let dueDate = null;
		if (ticket.sla?.length) {
			const createdAt = new Date(ticket.createdAt);
			createdAt.setHours(createdAt.getHours() + (ticket.sla[0] as any).resolution_time);
			dueDate = createdAt.toLocaleDateString('en-GB', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
			});
		}
		const assignedUser = (ticket as any)?.esclation?.length
			? (ticket as any).esclation?.[(ticket as any).esclation?.length - 1]?.assigned_to?.first_name ?? null
			: null;

		return {

			_id: ticket._id ?? null,
			ticket_number: ticket.ticket_number ?? null,
			title: ticket.title ?? null,
			description: ticket.description ?? null,
			status: ticket.status ?? null,
			priority: ticket.priority ? (ticket.priority as any).name : null,
			category: ticket.category ? (ticket.category as any).title : null,
			assigned_to: assignedUser,
			due_date: dueDate,
			createdAt: formatTime(ticket.createdAt),
			icon: (ticket as any).icon,

		};


	});
	// pagination: {
	// 	currentPage: page,
	// 		totalPages: Math.ceil(totalCount / limit),
	// 			totalItems: totalCount,
	// 				hasNextPage: page * limit < totalCount,
	// 					hasPrevPage: page > 1,
	// 		},

	return transformedResult;
};



export const getTicketDetailsByCategory = async (data: any) => {

	const { category } = data;
	const skip = (data.page - 1) * data.limit;
	const totalCount = await Ticket.countDocuments();
	const result = await Ticket.find()
		.select('_id ticket_number title description status priority createdAt')
		.populate({ path: 'category', select: 'title', options: { lean: true } })
		.populate({ path: 'priority', select: 'name', options: { lean: true } })
		.populate({ path: 'esclation', options: { lean: true }, populate: { path: 'assigned_to', select: 'first_name', options: { lean: true } } })
		.populate({ path: 'sla', options: { lean: true } })
		.populate({ path: 'status', select: 'name', options: { lean: true } })
		.lean()
		.where('category')
		.equals(category)
		.skip(skip)
		.limit(data.limit);
	for (const ticket of result) {
		if (ticket.status) {
			const iconData = await DashboardIcon.findOne({ name: ticket.status }).select('icon').lean();
			(ticket as any).icon = iconData?.icon || null;
		}
	};

	const transformedResult = result.map(ticket => {
		let dueDate = null;
		if (ticket.sla?.length) {
			const createdAt = new Date(ticket.createdAt);
			createdAt.setHours(createdAt.getHours() + (ticket.sla[0] as any).resolution_time);
			dueDate = createdAt.toLocaleDateString('en-GB', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
			});
		}
		const assignedUser = (ticket as any)?.esclation?.length
			? (ticket as any).esclation?.[(ticket as any).esclation?.length - 1]?.assigned_to?.first_name ?? null
			: null;
		return {

			_id: ticket._id ?? null,
			ticket_number: ticket.ticket_number ?? null,
			title: ticket.title ?? null,
			description: ticket.description ?? null,
			status: ticket.status ?? null,
			priority: ticket.priority ? (ticket.priority as any).name : null,
			category: ticket.category ? (ticket.category as any).title : null,
			assigned_to: assignedUser,
			due_date: dueDate,
			createdAt: formatTime(ticket.createdAt),
			icon: (ticket as any).icon,

		};


	});
	// pagination: {
	// 	currentPage: page,
	// 		totalPages: Math.ceil(totalCount / limit),
	// 			totalItems: totalCount,
	// 				hasNextPage: page * limit < totalCount,
	// 					hasPrevPage: page > 1,
	// 		},

	return transformedResult;

	// return result;
}

export const getTicketDetailsByPriority = async (data: any) => {

	const { priority } = data;
	const skip = (data.page - 1) * data.limit;
	const totalCount = await Ticket.countDocuments();
	const result = await Ticket.find()
		.select('_id ticket_number title description status priority createdAt')
		.populate({ path: 'category', select: 'title', options: { lean: true } })
		.populate({ path: 'priority', select: 'name', options: { lean: true } })
		.populate({ path: 'esclation', options: { lean: true }, populate: { path: 'assigned_to', select: 'first_name', options: { lean: true } } })
		.populate({ path: 'sla', options: { lean: true } })
		.populate({ path: 'status', select: 'name', options: { lean: true } })
		.lean()
		.where('priority')
		.equals(priority)
		.skip(skip)
		.limit(data.limit);
	(result as any).totalCount = totalCount;

	for (const ticket of result) {
		if (ticket.status) {
			const iconData = await DashboardIcon.findOne({ name: ticket.status }).select('icon').lean();
			(ticket as any).icon = iconData?.icon || 'https://assistly.hostree.in/images/images/email-verified.png';
		}
	}

	;
	const transformedResult = result.map(ticket => {
		let dueDate = null;
		if (ticket.sla?.length) {
			const createdAt = new Date(ticket.createdAt);
			createdAt.setHours(createdAt.getHours() + (ticket.sla[0] as any).resolution_time);
			dueDate = createdAt.toLocaleDateString('en-GB', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
			});
		}
		const assignedUser = (ticket as any)?.esclation?.length
			? (ticket as any).esclation?.[(ticket as any).esclation?.length - 1]?.assigned_to?.first_name ?? null
			: null;
		return {

			_id: ticket._id ?? null,
			ticket_number: ticket.ticket_number ?? null,
			title: ticket.title ?? null,
			description: ticket.description ?? null,
			status: ticket.status ?? null,
			priority: ticket.priority ? (ticket.priority as any).name : null,
			category: ticket.category ? (ticket.category as any).title : null,
			assigned_to: assignedUser,
			due_date: dueDate,
			createdAt: formatTime(ticket.createdAt),
			icon: (ticket as any).icon,

		};


	});
	// pagination: {
	// 	currentPage: page,
	// 		totalPages: Math.ceil(totalCount / limit),
	// 			totalItems: totalCount,
	// 				hasNextPage: page * limit < totalCount,
	// 					hasPrevPage: page > 1,
	// 		},

	return transformedResult;
	// return result;
}


export const ticketUpdate = async (data: any, session?: mongoose.ClientSession) => {
	const { _id, ...updateData } = data;
	const result = await Ticket.findByIdAndUpdate(
		_id,
		{ $set: updateData },
		{ new: true, session } 
	);

	await TicketViewCommentStatus.updateOne(
		{ ticket: _id },
		{
			$set: {
				agent_viewed: true,
				customer_viewed: false,
				updated_at: new Date()
			}
		},
		{ upsert: true, session }
	);

	return result;
};


export const removeAttachmentFromTicket = async (
	ticketId: string,
	attachmentId: string,
	session?: mongoose.ClientSession
) => {
	const result = await Ticket.findByIdAndUpdate(
		ticketId,
		{ $pull: { attachments: attachmentId } },
		{ new: true, session }
	);

	await TicketViewCommentStatus.updateOne(
		{ ticket: ticketId },
		{
			$set: {
				agent_viewed: false,
				customer_viewed: false,
				updated_at: new Date()
			}
		},
		{ upsert: true, session }
	);

	return result;
};


export const isTicketResolved = async (ticket_id: string,session?: mongoose.ClientSession) => {
	const result = await Ticket.findByIdAndUpdate(
		ticket_id,
		{ $set: { status: "RESOLVED", isAgentViewButtonShow:false, isAgenForceResolve: false,isResolved:false, isTicketClosed : true } },
		{ new: true, session }
	);
	await TicketViewCommentStatus.updateOne(
		{ ticket: ticket_id },
		{
			$set: {
				agent_viewed: true,
				customer_viewed: false,
				updated_at: new Date()
			}
		},
		{ upsert: true, session }
	);

	return result;
};

export const updateTicketSkipFeedback= async (ticketId:string)=>{
	const result = await Ticket.findByIdAndUpdate(ticketId,{isFeedback:true},{new:true})
	return result;
}

export const pendingTicketsForFeedback = async (userId: string) => {
	
	const result = await Ticket.find({isFeedback:false,creator:userId, status: { $in: ["RESOLVED", "CLOSED"] } })
		.select('_id ticket_number title description status priority createdAt')
		.populate({ path: 'category', select: 'title', options: { lean: true } })
		.populate({ path: 'priority', select: 'name', options: { lean: true } })
		.populate({ path: 'esclation', options: { lean: true }, populate: { path: 'assigned_to', select: 'first_name', options: { lean: true } } })
		.populate({ path: 'sla', options: { lean: true } })
		.populate({ path: 'status', select: 'name', options: { lean: true } })
		.lean()

	return result.map(ticket => ({
		_id: ticket._id,
		ticket_number: ticket.ticket_number,
		title: ticket.title,
		description: ticket.description,
		status: ticket.status,
		priority: (ticket.priority as any).name ?? null,
		createdAt: formatTime(ticket.createdAt),
		category: (ticket.category as any).title ?? null,
		assigned_to: ticket?.esclation?.at(-1)?.assigned_to?.first_name ?? null,
		
	}));
}
