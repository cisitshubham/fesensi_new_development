import mongoose, { Schema, Document, Model } from 'mongoose';
import { IndustryType } from './industryType.model';

interface IdProof {
	idType: string;
	idNumber: string;
	issuingAuthority: string;
	uploadIdProof: string;
}

interface PlanCommitment {
	planName: string;
	planDuration: string;
	noOfAgent: number;
}

export interface IOrganization extends Document {
	organizationName: string;
	orgType: string;
	industryType: String;
	orgEmail: string;
	orgContact: number;
	taxId?: string;
	marketingChannel: string;
	orgAddress: string;
	idProof?: IdProof;
	paymentId?: mongoose.Types.ObjectId;
	planCommitment?: PlanCommitment;
	hasCompletedDetails?: boolean;
	departments: mongoose.Types.ObjectId[];
	city: String;
	state: String
	country: String;
	zipCode: String;
	createdAt: Date;
	updatedAt: Date;
	website:String;
	accountDetails?: any; // Add this line to allow accountDetails property
}

const OrganizationSchema: Schema<IOrganization> = new Schema({
	organizationName: { type: String, required: true },
	orgType: { type: String, required: true },
	orgEmail: { type: String, required: true },
	orgContact: { type: Number, required: true },
	taxId: { type: String }, // Optional field added
	orgAddress: { type: String, required: true },
	city: {
		type: String,
		required: true
	},
	state: {
		type: String,
		required: true
	},
	country: {

		type: String,
		required: true
	},
	zipCode: {
		type: String,
		required: true
	},
	idProof: {
		idType: { type: String },
		idNumber: { type: String },
		issuingAuthority: { type: String },
		uploadIdProof: { type: String }
	},
	paymentId: {
		type: Schema.Types.ObjectId,
		ref: 'Payment',
		default: null
	},
	planCommitment: {
		planName: { type: String },
		planDuration: { type: String },
		noOfAgent: { type: Number }
	},
	industryType: {
		type: Schema.Types.ObjectId,
		ref: 'industryTypes',
		required: false
	},
	departments: [{
		type: Schema.Types.ObjectId,
		ref: 'departments',
		required: false
	}],
	website:{
		type:String,
		required:false
	},
	hasCompletedDetails: { type: Boolean, default: false },
	marketingChannel: { type: String, required: true },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now }
});

export const Organization: Model<IOrganization> = mongoose.model<IOrganization>('organization', OrganizationSchema);
