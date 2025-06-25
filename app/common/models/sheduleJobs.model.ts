import mongoose from 'mongoose';

const scheduledJobSchema = new mongoose.Schema({
	ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
	jobType: { type: String, enum: ['L2_ESCALATION', 'L3_ESCALATION'], required: true },
	scheduledTime: { type: Date, required: true },
	status: { type: String, enum: ['scheduled', 'completed', 'cancelled', 'failed'], default: 'scheduled' },
	failureReason: { type: String },
	retryCount: { type: Number, default: 0 },
	createdAt: { type: Date, default: Date.now }
});

export const ScheduledJob = mongoose.model('ScheduledJob', scheduledJobSchema);
