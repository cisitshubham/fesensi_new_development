import schedule from 'node-schedule';
import { Ticket as TicketModel } from '../models/ticket.model';
import { sendNotifications } from '../../common/services/push-notification.service';
import { User } from '../models/user.model';
import { NotificationType } from '../models/push-notification.model';

const scheduledJobs = new Map<string, schedule.Job>();
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const THIRTY_MINUTES = '*/30 * * * *';

export const checkResolutionTimeNotifications = async () => {
	try {
		const tickets = await TicketModel.find({
			status: { $nin: ['CLOSED','OPEN'] },
			isResolved: false,
		})
			.populate('sla')
			.populate('esclation')
			.lean();

		for (const ticket of tickets) {
			if (!ticket.sla?.length) continue;

			const lastEscalation = ticket.esclation?.[ticket.esclation.length - 1];
			const resolutionDeadline = lastEscalation?.escalation_time ? new Date(lastEscalation.escalation_time) : null;
			if (!resolutionDeadline) continue;

			const now = new Date();
			const shouldNotify = await updateTicketForceResolveStatus(ticket._id.toString(), resolutionDeadline);
			if (!shouldNotify || now >= resolutionDeadline) {
				await disableJob(ticket._id.toString());
				continue;
			}

			const ticketId = ticket._id.toString();
			if (!scheduledJobs.has(ticketId)) {
				const job = schedule.scheduleJob(ticketId, THIRTY_MINUTES, async () => {
					try {
						const currentTicket = await TicketModel.findById(ticketId)
							.populate('esclation')
							.lean();

						if (!currentTicket || currentTicket.status === 'CLOSED' || currentTicket.isResolved) {
							await disableJob(ticketId);
							return;
						}

						const lastEscalation = currentTicket.esclation?.[currentTicket.esclation.length - 1];
						const resolutionDeadline = lastEscalation?.escalation_time ? new Date(lastEscalation.escalation_time) : null;
						if (!resolutionDeadline || new Date() >= resolutionDeadline) {
							await disableJob(ticketId);
							return;
						}

						if (!lastEscalation?.assigned_to) return;

						const assignedAgent = await User.findById(lastEscalation.assigned_to);
						if (!assignedAgent) return;

						const now = new Date();
						const remainingTime = resolutionDeadline.getTime() - now.getTime();
						if (remainingTime <= 0) {
							await disableJob(ticketId);
							return;
						}

						const remainingHours = Math.floor(remainingTime / (60 * 60 * 1000));
						const remainingMinutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));

						const data = {
							userId: assignedAgent._id,
							agentNotification: `Ticket #${currentTicket.ticket_number} is approaching its resolution deadline. ${remainingHours}h ${remainingMinutes}m remaining. Please take action soon.`,
							notificationType: NotificationType.RESOLUTION_TIME_REMINDER,
							title: 'Resolution Deadline Reminder',
						};

						await sendNotifications(data);
					} catch (err) {
						await disableJob(ticketId);
					}
				});

				scheduledJobs.set(ticketId, job);
			}
		}
	} catch (err) {
		console.error('Resolution notification job failed:', err);
	}
};

export const startResolutionNotificationScheduler = () => {
	checkResolutionTimeNotifications();
	schedule.scheduleJob('0 * * * *', () => {
		checkResolutionTimeNotifications();
	});
};

const disableJob = async (ticketId: string) => {
	if (scheduledJobs.has(ticketId)) {
		const existingJob = scheduledJobs.get(ticketId);
		existingJob?.cancel();
		scheduledJobs.delete(ticketId);
	}
};

export const updateTicketForceResolveStatus = async (
	ticketId: string,
	resolutionDeadline: Date
): Promise<boolean> => {
	try {
		const ticket = await TicketModel.findById(ticketId);
		if (!ticket) return false;

		const now = new Date();
		const twoHoursFromNow = new Date(now.getTime() + TWO_HOURS_MS);
		const shouldForceResolve = resolutionDeadline.getTime() <= twoHoursFromNow.getTime();

		ticket.isAgenForceResolve = shouldForceResolve;
		await ticket.save();

		return shouldForceResolve;
	} catch (err) {
		return false;
	}
};
