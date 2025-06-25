import mongoose from 'mongoose';
import { Schema , Document } from 'mongoose';

export enum TrustLevelEnum {
	Excellent = 'Excellent',
	Good = 'Good',
	Average = 'Average',
	NeedsImprovement = 'Needs Improvement',
}


export interface ItrustLevel extends Document {
	agentId: string;
	level: string;
	trust_score: number;
	trustLevel: string;
	metrics:{}
	created_at: Date;
	updated_at: Date;
}

const trustLevelSchema = new Schema({
	agentId: {
		type: Schema.Types.ObjectId,
		ref: 'User',
	},
	level: {
		type: String,
		enum: TrustLevelEnum,
		required: true,
	},
	trust_score: {
		type: Number,
		required: true,
	},
	trustLevel: {
		type: String,
		enum: TrustLevelEnum,
		required: true,
	},
	metrics: {
		type: Object,
		required: true,
	},
	created_at: {
		type: Date,
		default: Date.now,
	},
	updated_at: {
		type: Date,
		default: Date.now,
	},
});

export const TrustLevel = mongoose.model<ItrustLevel>('TrustLevel', trustLevelSchema);




