import { esclation } from './../common/models/escaltion.model';
import { Ticket } from '../common/models/ticket.model'
import { DashboardIcon } from '../common/models/dashboard-icon.model'
import { Comment } from '../common/models/comment.model'
import { formatTime } from '../common/helper/formatTIme'
import { TicketViewCommentStatus } from '../common/models/ticketViewcommentStatus';
import * as  datamanipulationHelper from '../common/helper/AgentDatamanipulation.helper';
import { getCategoryCounts, getTicketCountByPiority, getTicketsByDateRange} from '../common/helper/tickets.helper'
import { getAllStatus } from '../admin/status/status.service'
import { getAllCategories } from '../admin/categories/categories.service'
import { Priorities } from '../common/models/priority.model'


export const getTicketCount = async (data: any) => {
	const { UserId, fromDate, todate } = data;
	const userId = UserId;
	const startDate = new Date(fromDate);
	const endDate = new Date(todate);
	startDate.setHours(0, 0, 0, 0);
	endDate.setHours(23, 59, 59, 999);

	const statusMap: Record<string, string> = { "OPEN": "0", "IN-PROGRESS": "1", "RESOLVED": "2", "CLOSED": "3", };

	const query: any = {
		esclation: { $exists: true, $ne: [] }
	};
	if (fromDate && todate) {
		query.createdAt = { $gte: startDate, $lte: endDate };
	}
	// Get tickets that have escalations
	const tickets = await Ticket.find(query)
		.select('_id status esclation adminReAssign')
		.populate({
			path: 'esclation',
			populate: { path: 'assigned_to', select: '_id' },
			options: { lean: true }
		})
		.lean();

	// Filter tickets where user is the last escalation assignee
	const filteredTickets = tickets.filter(ticket => {
		if (!ticket.esclation || ticket.esclation.length === 0) return false;
		const lastEscalation = ticket.esclation[ticket.esclation.length - 1];
		return lastEscalation?.assigned_to?._id?.toString() === userId.toString();
	});

	// Count tickets by status
	const statusCounts: Record<string, { count: number; icon: string }> = {};
	for (const status of Object.keys(statusMap)) {
		const count = filteredTickets.filter(ticket => ticket.status === status).length;
		const iconDoc = await DashboardIcon.findOne({ name: status }).select('icon').lean();
		statusCounts[status] = {
			count,
			icon: iconDoc?.icon || ''
		};
	}

	return Object.entries(statusCounts).map(([status, { count, icon }]) => ({
		status,
		count,
		icon
	}));
};

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
		.populate({ path: 'esclation', populate: { path: 'assigned_to', select: '_id' }, options: { lean: true } })
		.populate({ path: 'category', select: 'title', options: { lean: true } })
		.populate({ path: 'priority', select: 'name', options: { lean: true } }).lean();

	const filteredTickets = tickets.filter(ticket => {
		const latest = ticket.esclation?.[ticket.esclation.length - 1];
		return latest?.assigned_to?._id?.toString() === UserId.toString();
	});

	for (const status of statusList) {
		const count = filteredTickets.filter(ticket => ticket.status === status.name).length;
		statusCounts[status.name] = count;
	}

	const categoryCounts = await getCategoryCounts(filteredTickets);
	const priorityCounts = await getTicketCountByPiority(filteredTickets);
	const currentDateCounts = await getTicketsByDateRange(filteredTickets, fromDate, todate);
	const TicketByCategory = await TicketProgression(data);
	const TicketByStatus = await getTicketCount(data);

	return {
		statusCharts: statusCounts,
		categoryCharts: categoryCounts,
		priorityCharts: priorityCounts,
		ticketsbyVolume: currentDateCounts,
		TicketsByCategory: TicketByCategory,
		TicketsByStatus: TicketByStatus,
	};
};

// export const TicketProgression = async (data?: any) => {
// 	const categories = await getAllCategories();
// 	const now = new Date();

// 	const fromDate = data?.fromDate ? new Date(data.fromDate) : null;
// 	const toDate = data?.todate ? new Date(data.todate) : null;

// 	if (fromDate) fromDate.setHours(0, 0, 0, 0);
// 	if (toDate) toDate.setHours(23, 59, 59, 999);

// 	const isCustomRange = !!(fromDate || toDate);
// 	const allowedStatuses = ['OPEN', 'RESOLVED', 'IN-PROGRESS'];

// 	const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

// 	// Previous period date range
// 	let previousFromDate: Date | null = null;
// 	let previousToDate: Date | null = null;

// 	if (isCustomRange && fromDate && toDate) {
// 		const diff = toDate.getTime() - fromDate.getTime();
// 		previousToDate = new Date(fromDate.getTime() - 1);
// 		previousFromDate = new Date(previousToDate.getTime() - diff);
// 		previousFromDate.setHours(0, 0, 0, 0);
// 		previousToDate.setHours(23, 59, 59, 999);
// 	}

// 	const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
// 	const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
// 	const endOfLastMonth = new Date(startOfCurrentMonth.getTime() - 1);

// 	const counts = await Promise.all(
// 		categories.map(async (category: any) => {
// 			// Current period filter
// 			const filter: any = {
// 				category: category._id,
// 				status: { $in: allowedStatuses },
// 			};

// 			if (isCustomRange) {
// 				filter.createdAt = {};
// 				if (fromDate) filter.createdAt.$gte = fromDate;
// 				if (toDate) filter.createdAt.$lte = toDate;
// 			} else {
// 				filter.createdAt = { $gte: startOfCurrentMonth };
// 			}

// 			const tickets = await Ticket.find(filter)
// 				.populate({
// 					path: 'esclation',
// 					populate: { path: 'assigned_to', select: '_id' }
// 				})
// 				.lean();

// 			const agentTickets = tickets.filter(ticket => {
// 				const latestEscalation = ticket.esclation?.[ticket.esclation.length - 1];
// 				return latestEscalation?.assigned_to?._id?.toString() === data?.UserId?.toString();
// 			});

// 			const ticketCount = agentTickets.length;

// 			let lastMonthCount = 0;

// 			// Previous period filter
// 			if (isCustomRange && previousFromDate && previousToDate) {
// 				const lastMonthFilter = {
// 					category: category._id,
// 					status: { $in: allowedStatuses },
// 					createdAt: { $gte: previousFromDate, $lte: previousToDate }
// 				};

// 				const lastMonthTickets = await Ticket.find(lastMonthFilter)
// 					.populate({
// 						path: 'esclation',
// 						populate: { path: 'assigned_to', select: '_id' }
// 					})
// 					.lean();

// 				lastMonthCount = lastMonthTickets.filter(ticket => {
// 					const latestEscalation = ticket.esclation?.[ticket.esclation.length - 1];
// 					return latestEscalation?.assigned_to?._id?.toString() === data?.UserId?.toString();
// 				}).length;
// 			} else if (!isCustomRange) {
// 				const lastMonthFilter = {
// 					category: category._id,
// 					status: { $in: allowedStatuses },
// 					createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
// 				};

// 				const lastMonthTickets = await Ticket.find(lastMonthFilter)
// 					.populate({
// 						path: 'esclation',
// 						populate: { path: 'assigned_to', select: '_id' }
// 					})
// 					.lean();

// 				lastMonthCount = lastMonthTickets.filter(ticket => {
// 					const latestEscalation = ticket.esclation?.[ticket.esclation.length - 1];
// 					return latestEscalation?.assigned_to?._id?.toString() === data?.UserId?.toString();
// 				}).length;
// 			}

// 			// Percentage change from current period (100%)
// 			const percentageChange =
// 				ticketCount > 0
// 					? ((ticketCount - lastMonthCount) / ticketCount) * 100
// 					: 0;

// 			return {
// 				category: category.title,
// 				ticketCount,
// 				lastMonthCount,
// 				percentageChange: formatPercentage(percentageChange),
// 			};
// 		})
// 	);

// 	const totalTicketCount = counts.reduce((sum, c) => sum + c.ticketCount, 0);
// 	const totalLastMonthCount = counts.reduce((sum, c) => sum + c.lastMonthCount, 0);

// 	const overallPercentageChange =
// 		totalTicketCount > 0
// 			? ((totalTicketCount - totalLastMonthCount) / totalTicketCount) * 100
// 			: 0;

// 	return {
// 		overallPercentageChange: formatPercentage(overallPercentageChange),
// 		totalTicketCount,
// 		totalLastMonthCount,
// 		counts,
// 	};
// };

export const TicketProgression = async (data?: any) => {
	const categories = await getAllCategories();
	const now = new Date();

	let fromDate = data?.fromDate ? new Date(data.fromDate) : null;
	let toDate = data?.todate ? new Date(data.todate) : null;

	if (fromDate) fromDate.setHours(0, 0, 0, 0);
	if (toDate) toDate.setHours(23, 59, 59, 999);

	const isCustomRange = !!(fromDate && toDate);
	const allowedStatuses = ['OPEN', 'RESOLVED', 'IN-PROGRESS'];

	const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

	// Calculate previous date range dynamically (same length, immediately before current)
	let previousFromDate: Date | null = null;
	let previousToDate: Date | null = null;

	if (isCustomRange && fromDate && toDate) {
		const diffMs = toDate.getTime() - fromDate.getTime();
		previousToDate = new Date(fromDate.getTime() - 1);
		previousToDate.setHours(23, 59, 59, 999);

		previousFromDate = new Date(previousToDate.getTime() - diffMs);
		previousFromDate.setHours(0, 0, 0, 0);
	}

	// Default ranges if no custom range
	const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const endOfLastMonth = new Date(startOfCurrentMonth.getTime() - 1);
	endOfLastMonth.setHours(23, 59, 59, 999);

	let totalTicketCount = 0;
	let totalLastMonthCount = 0;

	const counts = await Promise.all(
		categories.map(async (category: any) => {
			// Current period filter
			const currentFilter: any = {
				category: category._id,
				status: { $in: allowedStatuses },
			};
			if (isCustomRange) {
				currentFilter.createdAt = { $gte: fromDate!, $lte: toDate! };
			} else {
				currentFilter.createdAt = { $gte: startOfCurrentMonth };
			}

			// Fetch current tickets with escalation populated
			const currentTickets = await Ticket.find(currentFilter)
				.populate({
					path: 'esclation',
					populate: { path: 'assigned_to', select: '_id' },
				})
				.lean();

			// Filter tickets assigned to user
			const agentCurrentTickets = currentTickets.filter((ticket) => {
				const escalations = ticket.esclation || [];
				const latestEscalation = escalations[escalations.length - 1];
				return latestEscalation?.assigned_to?._id?.toString() === data?.UserId?.toString();
			});

			const ticketCount = agentCurrentTickets.length;
			totalTicketCount += ticketCount;

			// Previous period filter
			let lastMonthCount = 0;

			if (isCustomRange && previousFromDate && previousToDate) {
				const prevFilter = {
					category: category._id,
					status: { $in: allowedStatuses },
					createdAt: { $gte: previousFromDate, $lte: previousToDate },
				};

				const prevTickets = await Ticket.find(prevFilter)
					.populate({
						path: 'esclation',
						populate: { path: 'assigned_to', select: '_id' },
					})
					.lean();

				const agentPrevTickets = prevTickets.filter((ticket) => {
					const escalations = ticket.esclation || [];
					const latestEscalation = escalations[escalations.length - 1];
					return latestEscalation?.assigned_to?._id?.toString() === data?.UserId?.toString();
				});

				lastMonthCount = agentPrevTickets.length;
			} else {
				// Default to last month if no custom range
				const prevFilter = {
					category: category._id,
					status: { $in: allowedStatuses },
					createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
				};

				const prevTickets = await Ticket.find(prevFilter)
					.populate({
						path: 'esclation',
						populate: { path: 'assigned_to', select: '_id' },
					})
					.lean();

				const agentPrevTickets = prevTickets.filter((ticket) => {
					const escalations = ticket.esclation || [];
					const latestEscalation = escalations[escalations.length - 1];
					return latestEscalation?.assigned_to?._id?.toString() === data?.UserId?.toString();
				});

				lastMonthCount = agentPrevTickets.length;
			}

			// Calculate percentage change safely
			const percentageChange = (() => {
				if (ticketCount === 0 && lastMonthCount > 0) return -100;
				if (lastMonthCount === 0 && ticketCount > 0) return 100;
				if (ticketCount === 0 && lastMonthCount === 0) return 0;
				return ((ticketCount - lastMonthCount) / lastMonthCount) * 100;
			})();

			totalLastMonthCount += lastMonthCount;

			return {
				category: category.title,
				ticketCount,
				lastMonthCount,
				percentageChange: formatPercentage(percentageChange),
			};
		})
	);

	// Overall percentage change
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


export const getAllTickets = async (_id: any, page = 1, limit = 10) => {
	const skip = (page - 1) * limit;
	const tickets = await Ticket.find().select('_id ticket_number title description status priority isAgentReAssign createdAt esclation')
		.populate({ path: 'esclation', options: { sort: { createdAt: 1 }, lean: true }, populate: { path: 'assigned_to', select: 'first_name', options: { lean: true }, } })
		.populate({ path: 'category', select: 'title', options: { lean: true } })
		.populate({ path: 'priority', select: 'name', options: { lean: true } })
		.populate({ path: 'sla', options: { lean: true } })
		.populate({ path: 'status', select: 'name', options: { lean: true } })
		.sort({ createdAt: -1 })
		.lean();

	const filtered = tickets.filter(ticket => {
		const latestEscalation = ticket.esclation?.sort((a, b) => b._id.toString().localeCompare(a._id.toString()))[0];
		return latestEscalation?.assigned_to?._id?.toString() === _id.toString();
	});
	const transformedResult = await Promise.all(
		filtered.map(ticket => {
			return datamanipulationHelper.transformTicketList(ticket);
		}));
	return transformedResult;
};



export const getAllRequestReassign = async (_id: any, data?: string, page = 1, limit = 10) => {
	const skip = (page - 1) * limit;
	const query: any = {
		status: { $in: ['OPEN', 'IN-PROGRESS'] },
		isAgentReAssign: data ? false : true,
	};
	const totalCount = await Ticket.countDocuments(query);
	const result = await Ticket.find(query)
		.select('_id ticket_number title description isAgentReAssign status priority createdAt')
		.populate({ path: 'category', select: 'title', options: { lean: true } })
		.populate({ path: 'priority', select: 'name', options: { lean: true } })
		.populate({ path: 'esclation', options: { lean: true }, populate: { path: 'assigned_to', select: 'first_name', options: { lean: true }, } })
		.populate({ path: 'sla', options: { lean: true } })
		.populate({ path: 'status', select: 'name', options: { lean: true } })
		.sort({ createdAt: -1 })
		.lean();

	// Only keep tickets where the last escalation's assigned_to matches the user ID
	const filtered = result.filter(ticket => {
		const lastEscalation = ticket.esclation?.[ticket.esclation.length - 1];
		return lastEscalation?.assigned_to?._id.toString() === _id.toString();
	});


	// Add icons and agent comment info
	for (const ticket of filtered) {
		if (ticket.status) {
			const iconData = await DashboardIcon.findOne({ name: ticket.status })
				.select('icon')
				.lean();
			(ticket as any).icon = iconData?.icon || 'https://assistly.hostree.in/images/images/email-verified.png';
		}
		const agentCommentStatus = await TicketViewCommentStatus.findOne({ ticket: ticket._id }).lean();
		(ticket as any).isAgentCommented = agentCommentStatus?.agent_viewed;
	}

	const transformedResult = await Promise.all(
		filtered.map(ticket => {
			return datamanipulationHelper.transformTicketListForAgentRequestReassign(ticket);
		}));
	return transformedResult;
};



export const getTicketByID = async (id: string) => {
	const result = await Ticket.findOne({ _id: id });
	return result;
}



export const getTicketDetails = async (id: string, page = 1, limit = 10) => {
	const skip = (page - 1) * limit;
	const totalCount = await Ticket.countDocuments({ _id: id });
	const result = await Ticket.find({ _id: id })
		.select('_id ticket_number creator title description status priority isAgentViewButtonShow isAgentResolvedButtonShow isTicketClosed isAgentReAssign isAgenForceResolve createdAt')
		.populate({ path: 'creator', select: 'first_name', options: { lean: true } })
		.populate({ path: 'category', select: 'title', options: { lean: true } })
		.populate({ path: 'priority', select: 'name', options: { lean: true } })
		.populate({ path: 'esclation', options: { lean: true }, populate: { path: 'assigned_to', select: 'first_name', options: { lean: true } } })
		.populate({ path: 'sla', options: { lean: true } })
		.populate('attachments', 'file_url file_type')
		.populate({ path: 'audit_log', select: 'creator action createdAt', options: { lean: true }, populate: { path: 'creator', select: 'first_name', options: { lean: true } } })
		.lean();
	const ticket = result[0];
	if (ticket) {
		const agentCommentStatus = await TicketViewCommentStatus.findOne({ ticket: ticket._id }).lean();
		(ticket as any).isUserCommented = agentCommentStatus?.agent_viewed || false;
	}

	const transformedResult = result.map(ticket => { return datamanipulationHelper.transformTicketTicketDetais(ticket) });
	return transformedResult;
};



export const addResolution = async (data: any) => {
	const result = await Comment.create(data);
	const updateData: any = {
		$push: {
			comments: result._id
		},
		$set: {}
	};

	if (data.status) {
		updateData.$set.status = data.status;
	}
	if (data.isResolved) {
		updateData.$set.isResolved = true;
		updateData.$set.IsAgentTicketEdit = false;
	}

	if (data.isAgentResolvedButtonShow) {
		updateData.$set.isAgentResolvedButtonShow = true;
	}
	if (data.isAgentViewButtonShow === false) {
		updateData.$set.isAgentViewButtonShow = false;
	}


	if (data.status === "CLOSED") {
		updateData.$set.isAgentViewButtonShow = false;
		updateData.$set.isAgentResolvedButtonShow = false;
		updateData.$set.isResolved = false;
	}



	await Ticket.findOneAndUpdate(
		{ _id: data.ticket },
		updateData,
		{ new: true }
	);
	const ticketViewUpdate: any = {
		updated_at: new Date()
	};

	if (data.status === "CLOSED") {
		ticketViewUpdate.agent_viewed = false;
		ticketViewUpdate.customer_viewed = false;
	} else {
		ticketViewUpdate.agent_viewed = false;
		ticketViewUpdate.customer_viewed = true;
	}
	await TicketViewCommentStatus.findOneAndUpdate(
		{ ticket: data.ticket },
		ticketViewUpdate,
		{ upsert: true }
	);

	return result;
};



export const Ticketincomplete = async (data: any) => {
	const result = await Comment.create(data);
	const updateData: any = {
		$push: {
			comments: result._id
		}
	};
	if (data.IsAgentTicketEdit) {
		updateData.$set = {
			IsAgentTicketEdit: data.IsAgentTicketEdit,
			isResolved: false,
			isAgentResolvedButtonShow: true,
		};
	}
	await Ticket.findOneAndUpdate(
		{ _id: data.ticket },
		updateData,
		{ new: true }
	);

	await TicketViewCommentStatus.findOneAndUpdate(
		{ ticket: data.ticket },
		{
			agent_viewed: false,
			customer_viewed: true,
			updated_at: new Date()

		},
		{ upsert: true }
	);
	return result;
};


export const updateCommetIDs = async (data: any) => {
	let updateData: any = {};
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
	if (data.auditlogId) {
		updateData.$push = {
			audit_log: data.auditlogId
		};
	}

	if (data.attachment_ids) {
		updateData.$push = {
			attachments: { $each: data.attachment_ids }
		};
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

export const getTicketDetailsByCategory = async (data: any) => {
	const { category, UserId, page = 1, limit = 10 } = data;
	const skip = (page - 1) * limit;
	const escalationIDs = (
		await esclation.find({ assigned_to: UserId }).select('_id').lean()
	).map(e => e._id);

	const query = {
		esclation: { $in: escalationIDs }
	};

	const totalCount = await Ticket.countDocuments(query);
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
		// .skip(skip)
		// .limit(limit)
		.lean()
		.where('category')
		.equals(category)
		.where()
		.sort({ createdAt: -1 });

	// Enhance each ticket
	for (const ticket of tickets) {
		if (ticket.status) {
			const icon = await DashboardIcon.findOne({ name: ticket.status })
				.select('icon')
				.lean();
			(ticket as any).icon = icon?.icon ?? null;
		}

		const agentCommentStatus = await TicketViewCommentStatus.findOne({
			ticket: ticket._id,
		}).lean();
		(ticket as any).isAgentCommented = agentCommentStatus?.agent_viewed;
	}

	const transformedResult = tickets.map(ticket => {
		let dueDate = null;
		if (ticket.sla?.length) {
			const createdAt = new Date(ticket.createdAt);
			createdAt.setHours(createdAt.getHours() + (ticket.sla[0] as any).resolution_time);
			dueDate = createdAt.toLocaleDateString('en-GB', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric'
			});
		}

		const assignedUser =
			(ticket as any)?.esclation?.length > 0
				? (ticket as any).esclation.at(-1)?.assigned_to?.first_name ?? null
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
			IsCumstomerCommneted: (ticket as any).isAgentCommented,
			isAgentReAssign: (ticket as any).isAgentReAssign
		};
	});
	// pagination: {
	// 	currentPage: page,
	// 		totalPages: Math.ceil(totalCount / limit),
	// 			totalItems: totalCount,
	// 				hasNextPage: page * limit < totalCount,
	// 					hasPrevPage: page > 1
	// }
	return transformedResult;
};


export const getTicketByDateRange = async (data: any) => {
	const { startDate, endDate, UserId, page = 1, limit = 10 } = data;
	const start = new Date(startDate);
	const end = new Date(endDate);

	if (isNaN(start.getTime()) || isNaN(end.getTime())) {
		throw new Error('Invalid startDate or endDate');
	}

	end.setHours(23, 59, 59, 999);
	const skip = (page - 1) * limit;

	// Get the escalation IDs assigned to the user
	const escalations = (
		await esclation.find({ assigned_to: UserId }).select('_id').lean()
	).map(e => e._id);

	const query = {
		createdAt: { $gte: start, $lte: end },
		esclation: { $in: escalations }
	};

	const totalCount = await Ticket.countDocuments(query);

	// Fetch the tickets based on the query
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
		// .skip(skip)
		// .limit(limit)
		.sort({ createdAt: -1 })
		.lean();

	// Add icons and other necessary fields
	for (const ticket of tickets) {
		// Add the status icon
		if (ticket.status) {
			const icon = await DashboardIcon.findOne({ name: ticket.status })
				.select('icon')
				.lean();
			(ticket as any).icon = icon?.icon ?? 'https://assistly.hostree.in/images/images/email-verified.png';
		}
		const agentCommentStatus = await TicketViewCommentStatus.findOne({
			ticket: ticket._id,
		}).lean();
		(ticket as any).isAgentCommented = agentCommentStatus?.agent_viewed;
	}
	const transformedResult = tickets.map(ticket => {
		let dueDate = null;
		if (ticket.sla?.length) {
			const createdAt = new Date(ticket.createdAt);
			createdAt.setHours(createdAt.getHours() + (ticket.sla[0] as any).resolution_time);
			dueDate = createdAt.toLocaleDateString('en-GB', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric'
			});
		}

		// Get the last assigned user from escalations
		const assignedUser = (ticket as any)?.esclation?.length
			? ((ticket as any).escalation?.[(ticket as any).escalation?.length - 1]?.assigned_to?.first_name ?? null)
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
			IsCumstomerCommneted: (ticket as any).isAgentCommented,
			isAgentReAssign: (ticket as any).isAgentReAssign
		};
	});

	// Pagination metadata
	const pagination = {
		currentPage: page,
		totalPages: Math.ceil(totalCount / limit),
		totalItems: totalCount,
		hasNextPage: page * limit < totalCount,
		hasPrevPage: page > 1
	};

	return transformedResult;
};



export const getFilteredTickets = async (data: any) => {
	const { page = 1, limit = 10, UserId, status, category, priority, startDate, endDate } = data;
	const skip = (page - 1) * limit;
	const query: any = {};



	// Get all escalations for the user instead of just the most recent one
	const escalations = await esclation
		.find({ assigned_to: UserId })
		.select('_id ticket')
		.lean();

	// Get tickets that have only one escalation and it's assigned to current user
	const singleEscalationTickets = await Ticket.find({ esclation: { $size: 1, $in: escalations.map(e => e._id) } }).select('_id').lean();
	if (singleEscalationTickets.length) {
		query._id = { $in: singleEscalationTickets.map(t => t._id) };
	} else {
		return [];
	}
	// Handle status filtering
	if (status) {
		const statusArray = Array.isArray(status) ? status : [status];
		if (statusArray.length > 0) {
			const normalizedStatus = statusArray.map(s => s.toUpperCase());
			query.status = { $in: normalizedStatus };
		}
	}

	if (category && Array.isArray(category) && category.length > 0) {
		query.category = { $in: category };
	}

	if (priority && Array.isArray(priority) && priority.length > 0) {
		query.priority = { $in: priority };
	}

	const parsedStartDate = Array.isArray(startDate) ? startDate[0] : startDate;
	const parsedEndDate = Array.isArray(endDate) ? endDate[0] : endDate;

	if (parsedStartDate && parsedEndDate) {
		const start = new Date(parsedStartDate);
		const end = new Date(parsedEndDate);
		end.setHours(23, 59, 59, 999);
		query.createdAt = { $gte: start, $lte: end };
	}

	const totalCount = await Ticket.countDocuments(query);
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
		.sort({ createdAt: -1 })
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

		const agentCommentStatus = await TicketViewCommentStatus.findOne({
			ticket: ticket._id,
		}).lean();
		(ticket as any).isAgentCommented = agentCommentStatus?.agent_viewed;

		const assignedUser = (ticket as any).esclation?.length
			? (ticket as any).esclation[(ticket as any).esclation.length - 1]?.assigned_to?.first_name ?? null
			: null;


		(transformedResult as any).totalCount = totalCount;



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
			IsCumstomerCommneted: (ticket as any).isAgentCommented,
			isAgentReAssign: (ticket as any).isAgentReAssign,
		});



	}

	const pagination = {
		currentPage: page,
		totalPages: Math.ceil(totalCount / limit),
		totalItems: totalCount,
		hasNextPage: page * limit < totalCount,
		hasPrevPage: page > 1,
	}
	return transformedResult
};





export const getTicketDetailsByStatus = async (data: any) => {
	const { page = 1, limit = 10, UserId, status } = data;
	const skip = (page - 1) * limit;
	const startDate = new Date(data.fromDate);
	const endDate = new Date(data.todate);
	startDate.setHours(0, 0, 0, 0);
	endDate.setHours(23, 59, 59, 999);
	const query: any = { status };
	console.log(startDate, endDate);

	if (data.fromDate && data.todate) {
		query.createdAt = { $gte: startDate, $lte: endDate };
	}


	// Count tickets created by user with this status
	const totalCount = await Ticket.countDocuments(query);
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
		.sort({ createdAt: -1 })
		// .skip(skip)
		// .limit(limit)
		.sort({ createdAt: -1 })
		.lean();

	const filteredTickets = tickets.filter(ticket => {
		const latestEscalation = ticket.esclation?.[ticket.esclation.length - 1];
		return latestEscalation?.assigned_to?._id?.toString() === UserId.toString();
	});

	const transformedResult = [];
	for (let i = 0; i < filteredTickets.length; i++) {
		const ticket = filteredTickets[i];
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
		let IsCustomerCommented = null;
		const latestComment = await Comment.findOne({ ticket: ticket._id })
			.sort({ createdAt: -1 })
			.populate({
				path: 'creator',
				select: 'role',
				populate: { path: 'role', select: 'role_name' }
			})
			.select('_id')
			.lean();


		const agentCommentStatus = await TicketViewCommentStatus.findOne({
			ticket: ticket._id,
		}).lean();
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
			isAgentReAssign: (ticket as any).isAgentReAssign
		});
	}
	// pagination: {
	// 	currentPage: page,
	// 		totalPages: Math.ceil(totalCount / limit),
	// 			totalItems: totalCount,
	// 				hasNextPage: page * limit < totalCount,
	// 					hasPrevPage: page > 1,
	// 	}
	return transformedResult;
};


export const getTicketDetailsByPriority = async (data: any) => {
	const { priority } = data;
	const skip = (data.page - 1) * data.limit;
	const totalCount = await Ticket.countDocuments();
	const escalations = await esclation
		.find({ assigned_to: data.UserId })
		.select('_id')
		.sort({ createdAt: -1 });
	const escalationID = escalations.map(e => e._id);
	const query: any = { esclation: { $in: escalationID }, };
	const result = await Ticket.find(query)
		.select('_id ticket_number title description status priority isAgentReAssign createdAt')
		.populate({ path: 'category', select: 'title', options: { lean: true } })
		.populate({ path: 'priority', select: 'name', options: { lean: true } })
		.populate({ path: 'esclation', options: { lean: true }, populate: { path: 'assigned_to', select: 'first_name', options: { lean: true } } })
		.populate({ path: 'sla', options: { lean: true } })
		.populate({ path: 'status', select: 'name', options: { lean: true } })
		.lean()
		.where('priority')
		.equals(priority)
		.sort({ createdAt: -1 });
	// .skip(skip)
	// .limit(data.limit);
	(result as any).totalCount = totalCount;
	for (const ticket of result) {
		if (ticket.status) {
			const iconData = await DashboardIcon.findOne({ name: ticket.status }).select('icon').lean();
			(ticket as any).icon = iconData?.icon || 'https://assistly.hostree.in/images/images/email-verified.png';
		}

		const agentCommentStatus = await TicketViewCommentStatus.findOne({
			ticket: ticket._id,
		}).lean();
		(ticket as any).isAgentCommented = agentCommentStatus?.agent_viewed;
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
			IsCumstomerCommneted: (ticket as any).isAgentCommented,
			isAgentReAssign: (ticket as any).isAgentReAssign

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

export const getUserCommentsByTicketId = async (ticketId: string) => {
	const totalCount = await Ticket.countDocuments({ _id: ticketId });
	const result = await Ticket.find({ _id: ticketId })
		.select('_id ticket_number title description status priority createdAt')
		.populate({ path: 'category', select: 'title', options: { lean: true } })
		.populate({ path: 'priority', select: 'name', options: { lean: true } })
		.populate({
			path: 'esclation',
			options: { lean: true },
			populate: {
				path: 'assigned_to',
				select: 'first_name',
				options: { lean: true }
			}
		})
		.populate({
			path: 'comments',
			select: '_id comment_text creator ticket createdAt',
			options: { lean: true },
			populate: {
				path: 'creator',
				select: 'first_name last_name role',
				populate: {
					path: 'role',
					select: 'role_name'
				}
			}
		})
		.populate({ path: 'sla', options: { lean: true } })
		.populate('attachments', 'file_url file_type')
		.populate('audit_log')
		.lean();

	let customerComment = null;
	let agentComment = null;

	const ticket = result[0];

	if (!ticket) {
		console.warn('No ticket found for the given ID.');
		return [];
	}

	const sortedComments = [...(ticket as any).comments].sort((a, b) => {
		return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
	});

	for (const comment of sortedComments) {
		const creator = comment.creator;
		const fullName = `${creator?.first_name ?? ''} ${creator?.last_name ?? ''}`.trim();
		let roleName = null;
		if (Array.isArray(creator?.role)) {
			const roleNames: string[] = creator.role.map((r: { role_name?: string }) => r?.role_name?.toUpperCase() ?? '');
			if (roleNames.includes('CUSTOMER')) {
				roleName = 'CUSTOMER';
			} else if (roleNames.includes('AGENT')) {
				roleName = 'AGENT';
			}
		} else if (creator?.role?.role_name) {
			roleName = creator.role.role_name.toUpperCase();
		}
		const formatted = {
			_id: comment._id,
			comment_text: comment.comment_text,
			creator: fullName,
			createdAt: formatTime(comment.createdAt),
		};

		if (!customerComment && roleName === 'CUSTOMER') {
			customerComment = formatted;
		}

		if (!agentComment && roleName === 'AGENT') {
			agentComment = formatted;
		}

		if (customerComment && agentComment) break;
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
			priority: ticket.priority ? (ticket.priority as any).name : null,
			customerComment,
			agentComment,
		};
	});

	return transformedResult;
};


export const AddResovedPost = async (data: any) => {
	const result = await Ticket.findByIdAndUpdate({ _id: data.ticket_id }, { isAgenForceResolve: false, isTicketClosed: true, resolvedPosts: data.resolvedPostId, status: 'RESOLVED', resolvedPostsComment: data.resolvedPostsComment });
	// Update view status
	await TicketViewCommentStatus.findOneAndUpdate(
		{ ticket: data.ticket_id },
		{ agent_viewed: false, customer_viewed: true },
		{ upsert: true }
	);
	return result;
}

export const requestReAssign = async (data: any) => {
	const { ticket_id, AgentreAssign, AgentreAssignComment } = data;
	const result = await Ticket.updateMany(
		{ _id: { $in: ticket_id } },
		{
			$set: { isAgentReAssign: false, AgentreAssign, AgentreAssignComment }
		}
	);

	await TicketViewCommentStatus.updateMany(
		{ ticket: { $in: ticket_id } },
		{
			$set: { agent_viewed: false, customer_viewed: false }
		},
		{ upsert: true }
	);

	return result;
};

export const clostTicket = async (data: any) => {
	const result = await Ticket.findByIdAndUpdate({ _id: data }, { status: "CLOSED", isAgenForceResolve: false, isTicketClosed: false, isResolved: false, isAgentResolvedButtonShow: true, isAgentViewButtonShow: false });
	await TicketViewCommentStatus.findOneAndUpdate(
		{ ticket: data },
		{ agent_viewed: false, customer_viewed: false },
		{ upsert: true }
	);
	return result;
}

// get Esclated tickets by user id
export const getEscalatedTickets = async (data: any) => {
	const { page = 1, limit = 10, UserId, status, priority, category, startDate, endDate } = data;
	const skip = (page - 1) * limit;
	const query: any = {
		status: { $ne: 'CLOSED' }
	};

	// Only add filters if they are provided
	if (status?.filter(Boolean).length) query.status = { $in: status };
	if (priority?.filter(Boolean).length) query.priority = { $in: priority };
	if (category?.filter(Boolean).length) query.category = { $in: category };
	if (startDate && endDate) query.createdAt = { $gte: startDate, $lte: endDate };

	const tickets = await Ticket.find(query).select('_id ticket_number title description status priority isAgentReAssign createdAt esclation')
		.populate({ path: 'esclation', options: { sort: { createdAt: 1 }, lean: true }, populate: { path: 'assigned_to', select: 'first_name', options: { lean: true } }, select: 'escalation_time level_of_user escalation_reason assigned_to createdAt' })
		.populate({ path: 'category', select: 'title', options: { lean: true } })
		.populate({ path: 'priority', select: 'name', options: { lean: true } })
		.populate({ path: 'sla', options: { lean: true }, select: 'resolution_time breach_action ,response_time' })
		.populate({ path: 'status', select: 'name', options: { lean: true } })
		// .skip(skip)
		// .limit(limit)
		.sort({ createdAt: -1 })
		.lean();

	// Filter tickets with multiple escalations
	const multipleEscalations = tickets.filter(ticket => ticket.esclation && ticket.esclation.length > 1);

	// Filter tickets assigned to current user
	const userMultipleEscalations = multipleEscalations.filter(ticket =>
		ticket.esclation?.some(escalation => escalation.assigned_to?._id?.toString() === UserId.toString())
	);

	return userMultipleEscalations.map(ticket => {
		// get latest escalation date
		const latestEscalation = ticket.esclation?.sort((a, b) => new Date(b.escalation_time).getTime() - new Date(a.escalation_time).getTime())[0];
		const escalation_time = latestEscalation?.escalation_time ? formatTime(latestEscalation.escalation_time) : null;


		return {
			_id: ticket._id,
			ticket_number: ticket.ticket_number,
			title: ticket.title,
			description: ticket.description,
			priority: (ticket.priority as any)?.name ?? null,
			category: (ticket.category as any)?.title ?? null,
			status: ticket.status,
			createdAt: formatTime(ticket.createdAt),
			escalation_date: escalation_time,
			esclated_user: latestEscalation?.assigned_to?.first_name ?? null,
			escalation_reason: (latestEscalation as any)?.escalation_reason ?? null,
		}
	})
}

export const getEscalatedTicketsByID = async (data: any) => {
	const { ticket_id } = data;
	const ticket = await Ticket.findOne({ _id: ticket_id })
		.populate({ path: 'esclation', options: { sort: { createdAt: 1 }, lean: true }, populate: { path: 'assigned_to', select: 'first_name', options: { lean: true }, } })
		.populate({ path: 'category', select: 'title', options: { lean: true } })
		.populate({ path: 'creator', select: 'first_name last_name', options: { lean: true } })
		.populate({ path: 'priority', select: 'name', options: { lean: true } })
		.populate({ path: 'sla', options: { lean: true } })
		.populate({ path: 'status', select: 'name', options: { lean: true } })
		.populate({ path: 'audit_log', select: 'action_by action creator createdAt', options: { lean: true }, populate: { path: 'creator', select: 'first_name last_name', options: { lean: true } } })
		.populate({ path: 'attachments', select: 'file_url file_type', options: { lean: true } })
		.lean();

	if (!ticket) {
		throw new Error('Ticket not found');
	}

	const esclation = ticket.esclation?.slice(-2).map(escalation => {
		return {
			assigned_to: escalation.assigned_to.first_name,
			escalation_time: formatTime(escalation.escalation_time),
			escalation_reason: (escalation as any).escalation_reason,
			level_of_user: (escalation as any).level_of_user === 'L1' ? 'Level 1' : (escalation as any).level_of_user === 'L2' ? 'Level 2' : (escalation as any).level_of_user === 'l3' ? 'Level 3' : null,
		}
	})
	const attachments = ticket.attachments?.map(attachment => {
		return {
			file_url: (attachment as any).file_url,
			file_type: (attachment as any).file_type,
		}
	})
	const activity_log = ticket.audit_log?.map(log => {
		return {
			action: (log as any).action,
			creator: (log as any).creator.first_name,
			createdAt: formatTime((log as any).createdAt),
		}
	})
	return {
		_id: ticket._id,
		ticket_number: ticket.ticket_number,
		created_by: (ticket.creator as any).first_name,
		title: ticket.title,
		priority: (ticket.priority as any)?.name ?? null,
		category: (ticket.category as any)?.title ?? null,
		assigned_to: ticket.esclation?.[0]?.assigned_to?.first_name ?? null,
		status: ticket.status,
		createdAt: formatTime(ticket.createdAt),
		description: ticket.description,
		escalation: esclation,
		sla: ticket.sla,
		attachments: attachments,
		activity_log: activity_log,
	}
}

// get all tickets sla status
export const getTicketsSlaStatus = async (data: any) => {
	const { page = 1, limit = 10, UserId } = data;
	const tickets = await Ticket.find().select('_id ticket_number title description status priority isAgentReAssign createdAt esclation')
		.populate({ path: 'esclation', options: { sort: { createdAt: 1 }, lean: true }, populate: { path: 'assigned_to', select: 'first_name', options: { lean: true }, } })
		.populate({ path: 'category', select: 'title', options: { lean: true } })
		.populate({ path: 'priority', select: 'name', options: { lean: true } })
		.populate({ path: 'sla', options: { lean: true } })
		.populate({ path: 'status', select: 'name', options: { lean: true } })
		.sort({ createdAt: -1 })
		.lean();

	// check if ticket has asssigned to user
	const userMultipleEscalations = tickets.filter(ticket => ticket.esclation?.some(escalation => escalation.assigned_to?._id?.toString() === UserId.toString()));
	const slaStatus = userMultipleEscalations.map(ticket => {
		const sla = ticket.sla;
		const status = ticket.status;
		return {
			_id: ticket._id,
			createdAt: formatTime(ticket.createdAt),
			ticket_number: ticket.ticket_number,
			title: ticket.title,
			status,
			priority: (ticket.priority as any)?.name ?? null,
			category: (ticket.category as any)?.title ?? null,
			assigned_to: ticket.esclation?.[0]?.assigned_to?.first_name ?? null,
			sla,
		};
	});

	return slaStatus;
}

// Helper function to get week number
const getWeekNumber = (date: Date): number => {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
	const week1 = new Date(d.getFullYear(), 0, 4);
	return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

export const getTicketCountByWeek = async (data: any) => {
	const { page = 1, limit = 10, UserId } = data;

	const tickets = await Ticket.find()
		.select('_id ticket_number title description status priority isAgentReAssign createdAt esclation')
		.populate({
			path: 'esclation',
			options: { sort: { createdAt: 1 }, lean: true },
			populate: { path: 'assigned_to', select: 'first_name', options: { lean: true } }
		})
		.populate({ path: 'category', select: 'title', options: { lean: true } })
		.populate({ path: 'priority', select: 'name', options: { lean: true } })
		.populate({ path: 'status', select: 'name', options: { lean: true } })
		.sort({ createdAt: -1 })
		.lean();

	const filteredTickets = tickets.filter(ticket => {
		const latest = ticket.esclation?.[ticket.esclation.length - 1];
		return latest?.assigned_to?._id?.toString() === UserId.toString();
	});

	const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

	// Get week start (Monday)
	const today = new Date();
	const startOfWeek = new Date(today);
	startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7));
	startOfWeek.setHours(0, 0, 0, 0);

	// Generate week dates from Monday to Sunday
	const weekDates: string[] = Array.from({ length: 7 }).map((_, i) => {
		const date = new Date(startOfWeek);
		date.setDate(startOfWeek.getDate() + i);
		return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
	});

	// Ticket count by week day
	const ticketCountByWeek = filteredTickets.reduce((acc: number[], ticket) => {
		const createdAt = new Date(ticket.createdAt);
		const endOfWeek = new Date(startOfWeek);
		endOfWeek.setDate(startOfWeek.getDate() + 6);
		endOfWeek.setHours(23, 59, 59, 999);

		if (createdAt >= startOfWeek && createdAt <= endOfWeek && createdAt <= today) {
			const dayIndex = (createdAt.getDay() + 6) % 7; // Convert Sunday=0 to Sunday=6
			acc[dayIndex]++;
		}

		return acc;
	}, Array(7).fill(0));

	return {
		ticketDays: days,
		ticketCountByWeek,
		weekDates
	};
};

export const slaKnowledgeBase = async () => {
	const priority = await Priorities.find().select('name esclationHrs createdAt')
		.sort({ createdAt: -1 })
		.lean();

	const priorityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
	priority.sort((a: any, b: any) => {
		const aIndex = priorityOrder.findIndex(p => p.toLowerCase() === a.name.toLowerCase());
		const bIndex = priorityOrder.findIndex(p => p.toLowerCase() === b.name.toLowerCase());
		return aIndex - bIndex;
	});

	return priority.map(priority => {
		return {
			priority: priority.name,
			response_time: priority.esclationHrs,
			createdAt: formatTime(priority.createdAt),
		}
	});
}

// update audit log 
export const updateAuditLog = async (ticketId: string, auditlogId: string) => {
	const result = await Ticket.findByIdAndUpdate(
		{ _id: ticketId },
		{ $push: { audit_log: auditlogId } },
		{ new: true }
	);
	return result;
}


