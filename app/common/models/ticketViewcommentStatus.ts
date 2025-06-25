import mongoose from 'mongoose';

const TicketViewCommentStatusSchema = new mongoose.Schema({
	ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true, unique: true },
	agent_viewed: { type: Boolean, default: true },
	customer_viewed: { type: Boolean, default: true },
	updated_at: { type: Date, default: Date.now },
	createdAt: { type: Date, default: Date.now }
});

export const TicketViewCommentStatus = mongoose.model('TicketViewCommentStatus', TicketViewCommentStatusSchema)
