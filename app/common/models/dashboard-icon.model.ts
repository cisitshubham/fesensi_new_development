import { Document, model, Schema } from 'mongoose'

export interface Iicon extends Document {
	name: string;
	icon: string;
	status: string;
}


const dashboardIcon = new Schema(
	{
		name:String,
		icon:String,
		status: { type: String, enum: ['Active', 'Inactive'] },
	},
	{
		timestamps: true,
	}
)

export const DashboardIcon = model<Iicon>('DashboardIcon', dashboardIcon)
