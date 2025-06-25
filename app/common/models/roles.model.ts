import mongoose from 'mongoose';



export interface IRole extends Document {
	role_name: string;
	permissions: string[];
	status: string;

}

export const RoleSchema = new mongoose.Schema<IRole>(
    {
		role_name: {
			type: String,
			required: true,
			unique: true,
		},
		permissions: [{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Permission',
			required: true,
		}],
		status: {
			type: String,
			enum: ['Active', 'Inactive'],
			default: 'Active',
		},
	},
	{
		timestamps: true,
	}
);

export const Role = mongoose.model<IRole>('Role', RoleSchema);

