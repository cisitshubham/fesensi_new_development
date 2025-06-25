import { Document, model, Schema } from 'mongoose';

export interface ILevel extends Document {
	name: string;
	status: 'ACTIVE' | 'INACTIVE';
}

const LevelSchema = new Schema<ILevel>(
	{
		name: { type: String, required: true },
		status: {
			type: String,
			enum: ['ACTIVE', 'INACTIVE'],
			required: true,
		},
	},
	{ timestamps: true }
);

export const Level = model<ILevel>('Levels', LevelSchema);
