import { Document, model, Schema } from 'mongoose'

export interface IStatus extends Document {
		name: string	
        status: { type: String, }
}


const status = new Schema(
	{
		name:{
			type: String,
            required: true,
        },	
		status: { type: String, 
			enum: ['ACTIVE', 'INACTIVE']
		}
	},
	{
		timestamps: true,
	}
)

export const Status = model<IStatus>('Status', status)
