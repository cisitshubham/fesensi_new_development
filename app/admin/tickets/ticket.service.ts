import { Ticket } from '../../common/models/ticket.model'
import { getAllCategories } from '../../admin/categories/categories.service'
import { getAllStatus } from '../../admin/status/status.service'
import { getCategoryCounts, getTicketCountByPiority, getTicketsByDateRange } from '../../common/helper/tickets.helper'
import * as esclationService from '../../esclation/esclation.service'
import { formatTime } from '../../common/helper/formatTIme'
import { DashboardIcon } from '../../common/models/dashboard-icon.model'
import { TicketViewCommentStatus } from '../../common/models/ticketViewcommentStatus'
import { Comment } from '../../common/models/comment.model'
import { calculateSLA } from '../../common/helper/AgentDatamanipulation.helper'



export const getTicketsCharts = async (data: any) => {
	const { UserId, fromDate, todate } = data;
	const statusCounts: Record<string, number> = {};
	const statusList = await getAllStatus();
	const startDate = new Date(fromDate);
	const endDate = new Date(todate);
	endDate.setHours(23, 59, 59, 999);
	const query: any = {};
	if (fromDate && todate) {
		query.createdAt = { $gte: startDate, $lte: endDate };
	}

	const tickets = await Ticket.find(query)
		.select('_id status esclation category createdAt')
		.populate({ path: 'category', select: 'title', options: { lean: true } })
		.populate({ path: 'priority', select: 'name', options: { lean: true } }).lean();

	for (const status of statusList) {
		const count = tickets.filter(ticket => ticket.status === status.name).length;
		statusCounts[status.name] = count;
	}
	const categoryCounts = await getCategoryCounts(tickets);
	const priorityCounts = await getTicketCountByPiority(tickets);
	const currentDateCounts = await getTicketsByDateRange(tickets, fromDate, todate);
	const getCategoryCount = await getTicketCategoryCount(data);
	const statusCount = await getTicketCount(data);
	return {
		statusCharts: statusCounts,
		categoryCharts: categoryCounts,
		priorityCharts: priorityCounts,
		ticketsbyVolume: currentDateCounts,
		TicketsByCategory: getCategoryCount,
		TicketCountbyStatus: statusCount
	};
};
export const getTicketCount = async (data: any) => {
	const statusMap: Record<string, string> = { "OPEN": "0", "IN-PROGRESS": "1", "RESOLVED": "2", "CLOSED": "3", };
	const { fromDate, todate } = data;
	const startDate = new Date(fromDate);
	const endDate = new Date(todate);
	endDate.setHours(23, 59, 59, 999);
	const query: any = {};
	if (fromDate && todate) {
		query.createdAt = { $gte: startDate, $lte: endDate };
	}
	const tickets = await Ticket.find(query)
		.select('_id status')
		.populate({ path: 'status', select: 'name', options: { lean: true } })
		.lean();

	// Count tickets by status
	const statusCounts: Record<string, { count: number; icon: string }> = {};
	for (const statusKey of Object.keys(statusMap)) {
		const count = tickets.filter(ticket => ticket.status === statusKey).length;
		const iconDoc = await DashboardIcon.findOne({ name: statusKey }).select('icon').lean();
		statusCounts[statusKey] = {
			count,
			icon: iconDoc?.icon || ''
		};
	}

	return Object.entries(statusCounts).map(([statusKey, { count, icon }]) => ({
		status: statusKey,
		count,
		icon
	}));
};

export const getTicketbyId = async (ticketId: string) => {
	const ticket = await Ticket.findById(ticketId);
	return ticket;
}

export const getTicketCategoryCount = async (data?: any) => {
	const categories = await getAllCategories();

	const seen = new Set();
	const uniqueCategories = categories.filter((cat: any) => {
		if (seen.has(cat.title)) return false;
		seen.add(cat.title);
		return true;
	});

	const now = new Date();

	let fromDate = data?.fromDate ? new Date(data.fromDate) : null;
	let toDate = data?.todate ? new Date(data.todate) : null;

	if (fromDate) fromDate.setHours(0, 0, 0, 0);
	if (toDate) toDate.setHours(23, 59, 59, 999);

	const isCustomRange = !!(fromDate && toDate);

	// Calculate previous date range based on current range length
	let previousFromDate: Date | null = null;
	let previousToDate: Date | null = null;

	if (isCustomRange && fromDate && toDate) {
		const days =
			Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

		previousToDate = new Date(fromDate);
		previousToDate.setDate(previousToDate.getDate() - 1);
		previousToDate.setHours(23, 59, 59, 999);

		previousFromDate = new Date(previousToDate);
		previousFromDate.setDate(previousToDate.getDate() - (days - 1));
		previousFromDate.setHours(0, 0, 0, 0);
	}

	// If no custom range, fallback to current month and previous month
	const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

	const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

	const counts = await Promise.all(
		uniqueCategories.map(async (category: any) => {
			const filter: any = { category: category._id };

			if (isCustomRange) {
				filter.createdAt = { $gte: fromDate, $lte: toDate };
			} else {
				filter.createdAt = { $gte: startOfCurrentMonth };
			}

			const ticketCount = await Ticket.countDocuments(filter);

			let lastMonthCount = 0;
			if (isCustomRange && previousFromDate && previousToDate) {
				const lastMonthFilter = {
					category: category._id,
					createdAt: { $gte: previousFromDate, $lte: previousToDate },
				};
				lastMonthCount = await Ticket.countDocuments(lastMonthFilter);
			} else if (!isCustomRange) {
				const lastMonthFilter = {
					category: category._id,
					createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
				};
				lastMonthCount = await Ticket.countDocuments(lastMonthFilter);
			}

			const percentageChange = (() => {
				if (ticketCount === 0 && lastMonthCount > 0) {
					return -100; // 100% decrease
				} else if (lastMonthCount === 0 && ticketCount > 0) {
					return 100; // 100% increase
				} else if (lastMonthCount === 0 && ticketCount === 0) {
					return 0;
				} else {
					return ((ticketCount - lastMonthCount) / lastMonthCount) * 100;
				}
			})();


			return {
				category: category.title,
				ticketCount,
				lastMonthCount,
				percentageChange: formatPercentage(percentageChange),
			};
		})
	);

	// Status counts for current period
	const statusFilter: any = {};
	if (isCustomRange) {
		statusFilter.createdAt = { $gte: fromDate, $lte: toDate };
	} else {
		statusFilter.createdAt = { $gte: startOfCurrentMonth };
	}

	const [openCount, resolvedCount, inProgressCount] = await Promise.all([
		Ticket.countDocuments({ ...statusFilter, status: 'OPEN' }),
		Ticket.countDocuments({ ...statusFilter, status: 'RESOLVED' }),
		Ticket.countDocuments({ ...statusFilter, status: 'IN-PROGRESS' }),
	]);

	const totalTicketCount = openCount + resolvedCount + inProgressCount;
	const totalLastMonthCount = counts.reduce((sum, c) => sum + c.lastMonthCount, 0);

	const overallPercentageChange =
		totalTicketCount > 0
			? ((totalTicketCount - totalLastMonthCount) / totalTicketCount) * 100
			: 0;

	return {
		overallPercentageChange: formatPercentage(overallPercentageChange),
		totalTicketCount,
		totalLastMonthCount,
		counts,
	};
};


export const getTicketsRequestReassign = async (data?: any) => {
	const query: any = {};
	
	if (data?.adminReAssign !== undefined) {
		query.adminReAssign = data.adminReAssign;
	}
	if (data?.isAgentReAssign !== undefined) {
		query.isAgentReAssign = data.isAgentReAssign;
	}	

	const tickets = await Ticket.find(query)
		.select('_id ticket_number title category priority status sla esclation AgentreAssign createdAt')
		.populate({ path: 'category', select: 'title', options: { lean: true } })
		.populate({ path: 'priority', select: 'name', options: { lean: true } })
		.populate({ path: 'esclation', populate: { path: 'assigned_to', select: '_id first_name', options: { lean: true } } })
		.populate({path:'AgentreAssign', select: 'title'})
		.populate({path:'sla',select:'resolution_time'})
		.sort({createdAt: -1})
		.lean();
	
	const transformTickets = tickets.map(ticket => {
		let resolutionTime = 0;
		let remainingHours = 0;
		let remainingMinutes = 0;
		let remainingSeconds = 0;
		let startTimer = false;
		let dueDate = '';

		if (ticket.sla?.length) {
			const sla = ticket.sla[0] as any;
			resolutionTime = sla.resolution_time;
			const slaDeadline = ticket?.esclation?.length
				? ticket.esclation[ticket.esclation.length - 1]?.escalation_time:0;
			const {
				remainingHours: slaHours,
				startTimer: slaStartTimer,
				remainingMinutes: slaMinutes,
				dueDate: slaDueDate,
				remainingSeconds: slaSeconds
			} = calculateSLA(new Date(slaDeadline), ticket.status, resolutionTime);
			remainingHours = slaHours;
			remainingMinutes = slaMinutes;
			remainingSeconds = slaSeconds;
			dueDate = slaDueDate;
			startTimer = slaStartTimer;
		}

		return {
			_id: ticket._id || '',
			ticket_number: ticket.ticket_number || '',
			title: ticket.title || '',
			priority: ticket.priority ? (ticket.priority as any).name : '',
			category: ticket.category ? (ticket.category as any).title : '',
			status: ticket.status || '',
			agent_reassign_comment: ticket.AgentreAssignComment || '',
			agent_reassign_reason: ticket.AgentreAssign ? (ticket.AgentreAssign as any).title : '',
			assigned_to: ticket.esclation ? (ticket.esclation as any).first_name : '',
			createdAt: formatTime(ticket.createdAt) || '',
			remainingHours,
			remainingMinutes,
			remainingSeconds,
			startTimer,
			dueDate,
			resolutionTime
		}
	})
	return transformTickets;
};
// get Ticket by id 
export const getTicketById = async (ticketId: string) => {
	const ticket = await Ticket.findById(ticketId)
	    .populate({ path: 'category', select: 'title', options: { lean: true } })
		.populate({ path: 'priority', select: 'name', options: { lean: true } })		
		.populate({ path: 'esclation', populate: { path: 'assigned_to', select: '_id first_name' } })
		.populate({path:'audit_log',populate:{path:'creator',select:'_id first_name'}})
		.populate({path:'category',select:'title',options:{lean:true}})
		.populate({ path:'AgentreAssign', select: 'title' })
		.lean();
	if (!ticket) {
		return null;
	}
	const activity_logs = ticket.audit_log?.map((log:any)=>{
		return {
			creator:log.creator.first_name,
			comment: log.action,
			createdAt:formatTime(log.createdAt),
		}
	})

	// get assigned to user by latest esclation
	const assigned_to = ticket.esclation?.sort((a:any,b:any)=>new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.assigned_to?.first_name;
	const ticketData = {
		_id: ticket._id,
		ticket_number: ticket.ticket_number,	
		title: ticket.title,
		priority: ticket.priority ? (ticket.priority as any).name : null,
		category: ticket.category ? (ticket.category as any).title : null,
		status: ticket.status,
		assigned_to: assigned_to,
		agent_reassign_comment: ticket.AgentreAssignComment,
		agent_reassign_reason: ticket.AgentreAssign ? (ticket.AgentreAssign as any).title : null,
		createdAt:formatTime(ticket.createdAt),	
		isadminReAssign:ticket.adminReAssign,
		activity_logs:activity_logs,
	}
	return ticketData;
}

export const updateTicketReassign = async (data: any) => {
	const { ticketId ,adminReAssignComment } = data;
	const ticket = await Ticket.findByIdAndUpdate(ticketId, { $set: { isAgentReAssign: true ,adminReAssign:false,adminReAssignComment: adminReAssignComment } }, { new: true });
	return ticket;
};

export const AssignTicketToAgent = async (data: any) => {
	const { ticket_id } = data;
	const esclation = await esclationService.createEscalation(data);
	const esclationId = esclation._id;
	const ticket = await Ticket.findByIdAndUpdate(ticket_id, { $set: { adminReAssign: true, isAgentReAssign: true } ,$push: { esclation: esclationId }}, { new: true });
	return ticket;
};

export const getAllTicketsByAdmin = async (data: any) => {
	const page = data.page || 1;
	const limit = data.limit || 10;
	const skip = (page - 1) * limit;
	const totalCount = await Ticket.countDocuments();
	const result = await Ticket.find()
		.select('_id ticket_number title description status priority createdAt')
		.populate({ path: 'category', select: 'title', options: { lean: true } })
		.populate({ path: 'priority', select: 'name', options: { lean: true } })
		.populate({ path: 'esclation', options: { lean: true }, populate: { path: 'assigned_to', select: 'first_name', options: { lean: true } } })
		.populate({ path: 'sla', options: { lean: true } })
		.populate({ path: 'status', select: 'name', options: { lean: true } })
		.populate({ path: 'creator', select: 'first_name', options: { lean: true } })
		.lean()
		.skip(skip)
		.sort({createdAt: -1})
		.limit(limit);

	for (const ticket of result) {
		if (ticket.status) {
			const iconData = await DashboardIcon.findOne({ name: ticket.status }).select('icon').lean();
			(ticket as any).icon = iconData?.icon || null;
		}
	}

	const totalPages = Math.ceil(totalCount / limit);
	const response = {
		totalCount: totalCount,
		totalPages: totalPages,
		currentPage: page,
		result: result.map((ticket, index) => {
			return {
				_id: ticket._id,
				ticket_number: ticket.ticket_number,
				title: ticket.title,
				description: ticket.description,
				status: ticket.status,
				priority: ticket.priority ? (ticket.priority as any).name : null,
				category: ticket.category ? (ticket.category as any).title : null,
				createdAt: formatTime(ticket.createdAt),
				icon: (ticket as any).icon,
				assigned_to: ticket.esclation?.length ? (ticket.esclation[ticket.esclation.length - 1] as any).assigned_to?.first_name : null,
				creator: ticket.creator ? (ticket.creator as any).first_name : null
			};
		})
	};

	return response;
}

export const getTicketDetailsByStatus = async (data: any, fromDate: string, todate: string) => {
	const { page = 1, limit = 10, UserId, status } = data;
	const startDate = new Date(fromDate);
	const endDate = new Date(todate);
	endDate.setHours(23, 59, 59, 999);

	// Build query
	const query: any = {};
	if (fromDate && todate) {
		query.createdAt = { $gte: startDate, $lte: endDate };
	}
	if (status) {
		query.status = status;
	}

	// Get total count first
	const totalCount = await Ticket.countDocuments(query);
	const totalPages = Math.ceil(totalCount / limit);
	const safePage = Math.min(Math.max(1, page), totalPages || 1); // Clamp page
	const skip = (safePage - 1) * limit;

	// Fetch paginated tickets
	const tickets = await Ticket.find(query)
		.select('_id ticket_number title description status priority isAgentReAssign createdAt')
		.populate({ path: 'category', select: 'title', options: { lean: true } })
		.populate({ path: 'priority', select: 'name', options: { lean: true } })
		.populate({
			path: 'esclation',
			options: { lean: true },
			populate: { path: 'assigned_to', select: 'first_name', options: { lean: true } }
		})
		.populate({ path: 'sla', options: { lean: true } })
		.populate({ path: 'status', select: 'name', options: { lean: true } })
		.skip(skip)
		.limit(limit)
		.lean();

	const transformedResult = [];

	for (const ticket of tickets) {
		const iconData = await DashboardIcon.findOne({ name: ticket.status }).select('icon').lean();
		const icon = iconData?.icon || 'https://assistly.hostree.in/images/images/email-verified.png';

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

		let resolutionTime = null;
		let remainingHours = null;
		let remainingMinutes = null;
		let remainingSeconds = null;
		let startTimer = null;

		if (ticket.sla?.length) {
			const sla = ticket.sla[0] as any;
			resolutionTime = sla.resolution_time;
			const slaDeadline = ticket?.esclation?.length
				? ticket.esclation[ticket.esclation.length - 1]?.escalation_time
				: 0;
			const {
				remainingHours: slaHours,
				startTimer: slaStartTimer,
				remainingMinutes: slaMinutes,
				dueDate: slaDueDate,
				remainingSeconds: slaSeconds
			} = calculateSLA(new Date(slaDeadline), ticket.status, resolutionTime);
			remainingHours = slaHours;
			remainingMinutes = slaMinutes;
			remainingSeconds = slaSeconds;
			dueDate = slaDueDate;
			startTimer = slaStartTimer;
		}

		const latestComment = await Comment.findOne({ ticket: ticket._id })
			.sort({ createdAt: -1 })
			.populate({
				path: 'creator',
				select: 'role',
				populate: { path: 'role', select: 'role_name' }
			})
			.select('_id')
			.lean();

		const agentCommentStatus = await TicketViewCommentStatus.findOne({ ticket: ticket._id }).lean();
		(ticket as any).isAgentCommented = agentCommentStatus?.agent_viewed;

		const assignedUser = (ticket as any).esclation?.length
			? (ticket as any).esclation[(ticket as any).esclation.length - 1]?.assigned_to?.first_name ?? null
			: null;

		transformedResult.push({
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
			icon,
			IsCumstomerCommneted: (ticket as any).isAgentCommented || null,
			isAgentReAssign: (ticket as any).isAgentReAssign,
			remainingHours,
			remainingMinutes,
			remainingSeconds,
			startTimer,
		});
	}

	return {
		ticketCounts: transformedResult,
		pagination: {
			currentPage: safePage,
			totalPages,
			totalItems: totalCount,
			hasNextPage: safePage < totalPages,
			hasPrevPage: safePage > 1,
			limit: limit 
		}
	};
};

export const updateTicketID = async (data: any) => {
	const { ticketId,audit_log_id} = data;
	const ticket = await Ticket.findByIdAndUpdate(ticketId,
		{ $push: {audit_log: audit_log_id } }, 
		 { new: true }
		);
	return ticket;	
}