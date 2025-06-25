import schedule from 'node-schedule';
import { TicketEscalation } from './ticketEsclation';
import { Ticket as TicketModel } from '../models/ticket.model';
import { ScheduledJob } from '../models/sheduleJobs.model';

const scheduledJobs = new Map<string, schedule.Job>();

export const ticketEscalationDynamicSchedule = async () => {
	// Fetch only tickets that are not CLOSED and already escalated to L1
	const tickets = await TicketModel.find({
		status: { $nin: ['CLOSED','OPEN'] },
	})
	.populate('category')
	.populate('esclation')
	.populate({ path: 'sla', select: 'resolution_time breach_action' })
	.lean();

	for (const ticket of tickets) {
		const ticketId = ticket._id.toString();
		const lastEscalation = ticket.esclation?.[ticket.esclation.length - 1];
		if (!lastEscalation || !lastEscalation.escalation_time) continue;

		const escalationTime = new Date(lastEscalation.escalation_time);
		if (escalationTime <= new Date()) continue;

		// Cancel and reschedule if job already exists
		if (scheduledJobs.has(ticketId)) {
			const existingJob = scheduledJobs.get(ticketId);
			existingJob?.cancel();
		}

		const job = schedule.scheduleJob(ticketId, escalationTime, async () => {
			try {
				console.log(`🚨 Executing escalation for Ticket: ${ticketId}`);
				await TicketEscalation();

				await ScheduledJob.findOneAndUpdate(
					{ ticketId },
					{ status: 'completed', failureReason: null }
				);
			} catch (err: any) {
				console.error(`❌ Escalation failed for Ticket: ${ticketId}`, err);
				await ScheduledJob.findOneAndUpdate(
					{ ticketId },
					{
						status: 'failed',
						failureReason: err?.message || 'Unknown error',
						$inc: { retryCount: 1 }
					}
				);
			} finally {
				scheduledJobs.delete(ticketId);
			}
		});

		scheduledJobs.set(ticketId, job);

		await ScheduledJob.findOneAndUpdate(
			{ ticketId },
			{
				ticketId,
				scheduledTime: escalationTime,
				jobType: 'escalation',
				status: 'scheduled',
			},
			{ upsert: true, new: true }
		);

		console.log(`📆 Scheduled escalation for Ticket: ${ticketId} at ${escalationTime.toISOString()}`);
	}
};

export const restoreScheduledJobs = async () => {
	const jobs = await ScheduledJob.find({ status: 'scheduled' });

	for (const job of jobs) {
		if (new Date(job.scheduledTime) <= new Date()) continue;
		schedule.scheduleJob(job.ticketId.toString(), new Date(job.scheduledTime), async () => {
			try {
				console.log(`🔁 Restored Job Triggered for Ticket: ${job.ticketId}`);
				await TicketEscalation();
				await ScheduledJob.findByIdAndUpdate(job._id, {
					status: 'completed',
					failureReason: null
				});
			} catch (err: any) {
				console.error(`❌ Restored Job Failed for Ticket: ${job.ticketId}`, err);
				await ScheduledJob.findByIdAndUpdate(job._id, {
					status: 'failed',
					failureReason: err?.message || 'Unknown error',
					$inc: { retryCount: 1 }
				});
			}
		});
	}
	console.log(`🔄 Restored ${jobs.length} scheduled jobs from DB.`);
};
