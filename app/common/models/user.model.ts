import { model, Schema } from 'mongoose'
import { IUser } from '../../user/user.dto'

const userSchema = new Schema(
	{
		email: { type: String, unique: true },
		password: { type: String, required: true },
		first_name: { type: String, required: true },
		last_name: { type: String },
		level: { type: String, default: null },
		otp: { type: String, default: null },
		categories: [{
			type: Schema.Types.ObjectId,
			ref: 'Categories',
			default: null
		}],		
		role: [
			{
				type: Schema.Types.ObjectId,
				ref: 'Role',
				default: null
			}
		],		
		tickets: [
			{
				type: Schema.Types.ObjectId,
				ref: 'Ticket',
			},
		],
		fcm_token: [
			{
				type: String,
				ref: 'FcmTokens',
				default: null
			}
		],
		orgId:{
			type: Schema.Types.ObjectId,
			ref: 'Organization',
			default: null
		},
		department:{
			type:String,
			default:null
		},
        designation:{
			type:String,
			default:null
		},
		contact:{
			type:String,
			default:null
		},
		profile_img: { type: String, default: null },
		status: { type: Boolean, default: false },
		lastOtpRequestTime: { type: Date, default: null },
		trustScore: { type: Number, default: 0 },
		trustLevel: { type: String, default: null },
		metrics: {
			totalTickets: { type: Number, default: 0 },
			totalRatings: { type: Number, default: 0 },
			avgRating: { type: Number, default: 0 },
			slaCompliantCount: { type: Number, default: 0 },
			notResolvedCount: { type: Number, default: 0 },
			avgResponseTimeScore: { type: Number, default: 0 }
		},
	},
	{
		timestamps: true,
	}
)

export const User = model<IUser>('User', userSchema)
