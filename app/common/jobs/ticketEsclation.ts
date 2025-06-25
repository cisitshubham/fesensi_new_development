import { esclation } from './../models/escaltion.model';
import { Ticket as TicketModel } from '../models/ticket.model';
import { User } from '../models/user.model';
import { SLA } from '../models/sla.models';
import { Role } from '../models/roles.model'
import { Types } from 'mongoose';

interface TicketDoc {
	_id: Types.ObjectId;
	esclation: any[];
	sla: {
		_id: Types.ObjectId;
		resolution_time: number;
		breach_action: string;
	};
	createdAt: Date;
	status: string;
	category: Types.ObjectId;
	isEsclatedL1: boolean;
	isEsclatedL2: boolean;
	isEsclatedL3: boolean;
	save: () => Promise<void>;
}

export const TicketEscalation = async (): Promise<void> => {
	const currentTime = Date.now();

	// Fetch tickets that are in progress or open
	const tickets = await TicketModel.find({ status: { $nin: ['CLOSED', 'OPEN'] } })
		.populate('esclation')
		.populate({ path: 'sla', select: '_id breach_action resolution_time' })
		.exec();
		
	const role = await Role.findOne({ name: 'AGENT' });
	const l2Users = await User.find({level: 'L2',role: { $in: [role?._id] }}).lean().exec();
	const l3Users = await User.find({level: 'L3',role: { $in: [role?._id] }}).lean().exec();

	for (const ticket of tickets) {
		const lastEscalation = ticket.esclation?.[ticket.esclation.length - 1];
		if (!lastEscalation) continue;

		const escalationTime = new Date(lastEscalation.escalation_time).getTime();
		if (currentTime < escalationTime) continue;

		const resolutionTime = (ticket.sla![0] as { resolution_time?: number })?.resolution_time ?? 0;
		
		if (resolutionTime <= 0) continue;
		const nextEscalationTime = new Date(Date.now() + resolutionTime * 60 * 60 * 1000);

		
		
		// L1 to L2
		if (lastEscalation.level_of_user === 'L1' && !(ticket as any).isEsclatedL2) {
			const assignedToL2 = l2Users.find(user =>
				user.categories?.some((cat: any) => cat.toString() === ticket.category?.toString())
			);
			console.log('assignedToL2', assignedToL2);
			if (!assignedToL2) continue;

			await escalateTicket(ticket as unknown as TicketDoc, assignedToL2._id.toString(), 'L2', 'SLA_Breach_L2', nextEscalationTime);
			await updateSLA((ticket.sla as any)._id, 'SLA_Breach_L2');
			(ticket as any).isEsclatedL2 = true;
			await ticket.save();

			console.log(`Escalated ticket ${ticket._id} to L2 at ${new Date().toISOString()}`);
		}

		// L2 to L3
		else if (lastEscalation.level_of_user === 'L2' && !(ticket as any).isEsclatedL3) {
			const assignedToL3 = l3Users.find(user =>
				user.categories?.some((cat: any) => cat.toString() === ticket.category?.toString())
			);
			if (!assignedToL3) continue;

			await escalateTicket(ticket as unknown as TicketDoc, assignedToL3._id.toString(), 'L3', 'SLA_Breach_L3', nextEscalationTime);
			await updateSLA((ticket.sla as any)._id, 'SLA_Breach_L3');
			(ticket as any).isEsclatedL3 = true;
			await ticket.save();
			console.log(`Escalated ticket ${ticket._id} to L3 at ${new Date().toISOString()}`);
		}
	}
};

// Helper to update SLA breach action
const updateSLA = async (slaId: string, breachAction: string): Promise<void> => {
	await SLA.findByIdAndUpdate(slaId, { breach_action: breachAction }).exec();
};

// Helper to create an escalation record
const escalateTicket = async (
	ticket: TicketDoc,
	assignedUserId: string,
	level: 'L2' | 'L3',
	reason: string,
	escalationTime: Date): Promise<void> => {
	const escalationDoc = await esclation.create({
		assigned_to: assignedUserId,
		level_of_user: level,
		category_id: ticket.category,
		escalation_time: escalationTime,
		level2_escalated_reason: level === 'L2' ? reason : null,
		level3_escalated_reason: level === 'L3' ? reason : null,
		level2_escalated_time: level === 'L2' ? Date.now() : null,
		level3_escalated_time: level === 'L3' ? Date.now() : null,
		ticket_id: ticket._id.toString(),
	});
	await TicketModel.findByIdAndUpdate(ticket._id, {
		$push: { esclation: escalationDoc._id },
	}).exec();
};
