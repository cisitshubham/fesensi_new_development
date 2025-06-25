
import { Document, model, Schema } from 'mongoose'
export interface IReassignment extends Document {
	title: String,
	creator: Schema.Types.ObjectId,
}

const ReassignmentsSchema = new Schema(
	{
		title:String,
		creator: Schema.Types.ObjectId,
	},
	{
		timestamps: true,
	}
)

export const Reassignments = model<IReassignment>('Reassignments', ReassignmentsSchema)
