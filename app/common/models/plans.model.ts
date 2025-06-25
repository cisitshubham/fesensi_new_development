import mongoose, { Schema, Document, Model } from 'mongoose';

export enum PlanDuration {
	MONTH = 'month',
	YEAR = 'year',
	LIFETIME = 'lifetime',
	SIX_MONTHS = '6_months',
	TWO_YEARS = '2_years',
	THREE_YEARS = '3_years',
	FOUR_YEARS = '4_years'
}

export interface IPlan extends Document {
	_id: mongoose.Types.ObjectId;
	name: string;
	rate: number;
	duration: number; // Duration in months
	createdBy: mongoose.Types.ObjectId;
	status: boolean;
	createdAt: Date;
	updatedAt: Date;

}

export const PlanSchema: Schema = new Schema({
	name: { type: String, required: true },
	createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	rate: { type: Number, required: true },
	duration: [{
		type: String,
		required: true,
		enum: Object.values(PlanDuration)
	}], // Duration in months
	status: { type: Boolean, default: true },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now }
});

export const Plan: Model<IPlan> = mongoose.model<IPlan>('plans', PlanSchema);