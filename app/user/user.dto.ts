import { Document, Schema } from 'mongoose'
import { BaseSchema } from '../common/dto/base.dto'

export interface IUser extends BaseSchema, Document {
	first_name: string
    last_name?: string
    email: string	
	contact?:string,
    password: string
	fcm_token?: string
	categories?: Schema.Types.ObjectId[];
	level?: string
    otp?: string,
	role?: string
	status?: boolean;
	profile_img?: string
	orgId?:string|Schema.Types.ObjectId ,
    tickets?: Schema.Types.ObjectId[]
    lastOtpRequestTime?: Date
    trustScore?: number
    trustLevel?: string
    metrics?: {
        totalTickets?: number;
        totalRatings?: number;
        avgRating?: number;
        slaCompliantCount?: number;
        notResolvedCount?: number;
        avgResponseTimeScore?: number;
    }
}
