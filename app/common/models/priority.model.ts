import { Document, model, Schema } from 'mongoose'

export interface IPriorities extends Document {
		name: string	
		esclationHrs: Number,	
		responseHrs: Number,
		creator:Schema.Types.ObjectId
        status: { type: String, }
        createdAt: Date
}


const priorities = new Schema(
	{
		name:{
			type: String,
        },
		creator:{
			type:Schema.Types.ObjectId,
			ref:"User"
		},
		responseHrs:Number,
	    esclationHrs:Number,
		colourCode: String,	
		status: { type: String, 
			enum: ['ACTIVE', 'INACTIVE']
		}
	},
	{
		timestamps: true,
	}
)

export const Priorities = model<IPriorities>('Priorities', priorities)
