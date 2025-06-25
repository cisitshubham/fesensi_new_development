import { Document, model, Schema } from 'mongoose'

export interface ISLA extends Document {

	priority: string;
	response_time: number;
	resolution_time: number;
	breach_action: string;
	status: string;

}


const sla = new Schema(
	{
	priority:{
			type: String,
            required: true,  
		},
	response_time:{
			type: Number,
            required: true,
		},	
	resolution_time:{
		    type: Number,
            required: true,
        },
	breach_action:{
			type: String,  
        },
		
	status:{type: String,
		enum: ['Active', 'Inactive']
	},
	ticket_id:{
		type: Schema.Types.ObjectId,
		ref: 'Ticket',
	},
				
	},		
	
	{
		timestamps: true,
	}
)

export const SLA = model<ISLA>('sla', sla)
