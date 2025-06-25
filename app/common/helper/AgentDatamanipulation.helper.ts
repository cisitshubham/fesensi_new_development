import {formatTime} from './formatTIme';
import { DashboardIcon } from '../models/dashboard-icon.model'
import { TicketViewCommentStatus } from '../models/ticketViewcommentStatus';






// Sort commnents by date in descending order
export const sortCommentsByDate = (comments: any[]) => {
	return [...comments].sort((a, b) => {
		return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
	});
};

// Get customer and agent comments from the comments array
export const getCustomerAndAgentComments = (comments: any[]) => {
	let customerComment = null;
	let agentComment = null;
	for (const comment of comments) {
		const creator = comment.creator;
		const fullName = `${creator?.first_name ?? ''} ${creator?.last_name ?? ''}`.trim();
		const roleName = Array.isArray(creator?.role)? creator.role[0]?.role_name: creator?.role?.role_name;

		const formatted = {
			_id: comment._id,
			comment_text: comment.comment_text,
			creator: fullName,
			role: roleName,
			createdAt: formatTime(comment.createdAt),
		};

		if (!customerComment && roleName?.toUpperCase() === 'CUSTOMER') {
			customerComment = formatted;
		}

		if (!agentComment && roleName?.toUpperCase() === 'AGENT') {
			agentComment = formatted;
		}
		if (customerComment && agentComment) break;
	}

	return { customerComment, agentComment };
};

// Caculate SLA like(due date, remaining time, start timer)
export const calculateSLA = (esclationDate: Date, status: string, resolutionTime: number) => {
    const slaDeadline = new Date(esclationDate);
    const now = new Date();
    const timeDiffMs = slaDeadline.getTime() - now.getTime();
    let remainingHours = 0;
    let remainingMinutes = 0;
    let remainingSeconds = 0;
    let startTimer = false;

    // Only calculate remaining time if ticket is active and has time left
    if (timeDiffMs > 0 && !['CLOSED', 'OPEN'].includes(status)) {
        remainingHours = Math.floor(timeDiffMs / (1000 * 60 * 60));
        remainingMinutes = Math.floor((timeDiffMs % (1000 * 60 * 60)) / (1000 * 60));
        remainingSeconds = Math.floor((timeDiffMs % (1000 * 60)) / 1000);
        startTimer = true;
    }

    // Format due date consistently
    const dueDate = slaDeadline.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    return { 
        remainingHours, 
        remainingMinutes, 
        remainingSeconds, 
        dueDate,
        startTimer,
        rawDueDate: slaDeadline // Include raw date for flexibility
    };
};

// Activity log
export const activity_log = (ticket: any) => {
	const activityLog = ticket.audit_log.map((log: any) => {
		const creator = log.creator;
		const fullName = `${creator?.first_name ?? ''} ${creator?.last_name ?? ''}`.trim();
		const roleName = Array.isArray(creator?.role)
			? creator.role[0]?.role_name
			: creator?.role?.role_name;
		return {
			_id: log._id,
			action: log.action,
			createdAt: formatTime(log.createdAt),
			creator: fullName,
			role: roleName,
};})
return activityLog;
};

// Get icon url by ticket status
export const getIconUrl = async (status: string): Promise<string> => {
	const dashboardIcons = await DashboardIcon.find({}).lean();
	const result = dashboardIcons.find((icon) => icon.name === status);
	return result?.icon || 'https://assistly.hostree.in/images/images/email-verified.png';
};



	
// Ticket details transformation function
export const transformTicketTicketDetais = (ticket: any) => {
	let resolutionTime = null;
	let remainingHours = null;
	let remainingMinutes = null;
	let remainingSeconds: number | null = null;
	let dueDate = null;
	let startTimer = false;
	
	if (ticket.sla?.length) {
		const sla = ticket.sla[0] as any;
		resolutionTime = sla.resolution_time;
	    const	slaDeadline = ticket?.esclation?.length
			? ticket.esclation[ticket.esclation.length - 1]?.escalation_time
			: null;
		const { remainingHours: slaHours, startTimer: slaStartTimer, remainingMinutes: slaMinutes, dueDate: slaDueDate, remainingSeconds: slaSeconds } = 
		calculateSLA(new Date(slaDeadline), ticket.status, resolutionTime);
		remainingHours = slaHours;
		remainingMinutes = slaMinutes;
		remainingSeconds = slaSeconds;
		dueDate = slaDueDate;
		startTimer = slaStartTimer;
		
	}
	
	


		const sla = ticket.sla[0] as any;
		const slaDeadline = new Date(ticket.createdAt.getTime() + sla.resolution_time * 60 * 60 * 1000);
		const now = new Date();
		const timeDiffMs = slaDeadline.getTime() - now.getTime();
		if (timeDiffMs < 2 * 60 * 60 * 1000) {
			(ticket as any).isAgenForceResolve = true;
			
		}
		if (resolutionTime === 0) {
			(ticket as any).isAgenForceResolve = false;
		}

	
	

	const assignedUser = (ticket as any)?.esclation?.length
		? (ticket as any).esclation?.[(ticket as any).esclation?.length - 1]?.assigned_to?.first_name ?? null
		: null;
	const creator = (ticket as any)?.creator?.first_name ?? null;	
	return {
		_id: ticket._id ?? null,
		creator: creator,
		ticket_number: ticket.ticket_number ?? null,
		title: ticket.title ?? null,
		description: ticket.description ?? null,
		status: ticket.status ?? null,
		priority: ticket.priority ? (ticket.priority as any).name : null,
		category: ticket.category ? (ticket.category as any).title : null,
		assigned_to: assignedUser,
		due_date: dueDate,
		isAgentResolvedButtonShow: (ticket as any).isAgentResolvedButtonShow,
		isAgentViewButtonShow: (ticket as any).isAgentViewButtonShow,
		isAgenForceResolve: (ticket as any).isAgenForceResolve,
		isAgentReAssign: (ticket as any).isAgentReAssign,
		isTicketClosed: (ticket as any).isTicketClosed,
		createdAt: formatTime(ticket.createdAt),
		startTimer: startTimer,
		resolutionTime: resolutionTime,
		remainingHours: remainingHours,
		remainingMinutes: remainingMinutes,
		remainingSeconds: remainingSeconds,
		attachments: ticket.attachments,
		activity_log: activity_log(ticket),
	};
};


// Ticket list transformation function
export const transformTicketList = async (ticket: any) => {
	let resolutionTime = null;
	let remainingHours = null;
	let remainingMinutes = null;
	let remainingSeconds: number | null = null;
	let dueDate = null;
	let startTimer = false;

	const assignedUser = ticket?.esclation?.length
		? ticket.esclation[ticket.esclation.length - 1]?.assigned_to?.first_name ?? null
		: null;

	if (ticket.sla?.length) {
		const sla = ticket.sla[0] as any;
		resolutionTime = sla.resolution_time;
		const slaDeadline = ticket?.esclation?.length
			? ticket.esclation[ticket.esclation.length - 1]?.escalation_time
			: null;
		console.log(slaDeadline);

		const {
			remainingHours: slaHours,
			startTimer: slaStartTimer,
			remainingMinutes: slaMinutes,
			dueDate: slaDueDate,
			remainingSeconds: slaSeconds
		} = calculateSLA(slaDeadline, ticket.status, resolutionTime);
		remainingHours = slaHours;
		remainingMinutes = slaMinutes;
		remainingSeconds = slaSeconds;
		dueDate = slaDueDate;
		startTimer = slaStartTimer;
	}	

	const creator = ticket?.creator?.first_name ?? null;
	const icon = await getIconUrl(ticket.status);
	const agentCommentStatus = await TicketViewCommentStatus.findOne({
		ticket: ticket._id,
	}).lean();
	(ticket as any).isAgentCommented = agentCommentStatus?.agent_viewed;

	return {
		_id: ticket._id ?? null,
		ticket_number: ticket.ticket_number ?? null,
		title: ticket.title ?? null,
		description: ticket.description ?? null,
		status: ticket.status ?? null,
		priority: ticket.priority ? ticket.priority.name : null,
		category: ticket.category ? ticket.category.title : null,
		assigned_to: assignedUser,
		due_date: dueDate,
		createdAt: formatTime(ticket.createdAt),
		icon: icon,
		IsCumstomerCommneted: ticket?.isAgentCommented,
		isAgentReAssign: ticket?.isAgentReAssign,
		startTimer: startTimer,
		remainingHours: remainingHours,
		remainingMinutes: remainingMinutes,
		remainingSeconds: remainingSeconds,
		resolutionTime: resolutionTime,
	
	};
};


// Tciket list transformation for Agent Request Reassign
export const transformTicketListForAgentRequestReassign = (ticket: any) => {
	let dueDate = null;
	
	if (ticket.sla?.length) {
		const sla = ticket.sla[0] as any;
		const {dueDate: slaDueDate} = calculateSLA(new Date(ticket.createdAt), ticket.status, sla.resolution_time);
		dueDate = slaDueDate;
	}		
	const lastEscalation = ticket.esclation?.[ticket.esclation.length - 1];
	const assignedUser = lastEscalation?.assigned_to?.first_name ?? null;
	const timerEndDate = lastEscalation?.escalation_time ?? null;
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
		isAgentRequestReAssign: (ticket as any).isAgentReAssign,
	};
};



