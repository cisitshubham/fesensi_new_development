import mongoose, { Document } from 'mongoose'

export interface IPermission extends Document {
	name: string 
	method: string
	role: string
	createdAt: Date
}

const PermissionSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			unique: true,
		},
		method: {
			type: String,	
		},
		role:String, 
	},

	{
		timestamps: true,
	}
)

export const Permission = mongoose.model<IPermission>('Permission', PermissionSchema)
