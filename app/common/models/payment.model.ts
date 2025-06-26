import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayment extends Document {
	organizationId: mongoose.Types.ObjectId;
	userId?: mongoose.Types.ObjectId;

	// Payment gateway info
	gateway: 'stripe' | 'razorpay' | 'manual';
	gatewayPaymentId: string;
	gatewayOrderId?: string;
	paymentMethod: string;

	// Financials
	amount: number;                // base amount
	taxPercent?: number;
	taxAmount?: number;
	discountType?: 'flat' | 'percentage';
	discountValue?: number;
	discountAmount?: number;
	totalAmount: number;          // final amount = amount + tax - discount
	currency: string;

	// Invoice/billing
	invoiceNumber?: string;
	billingPeriod?: {
		start: Date;
		end: Date;
	};
	planName?: string;
	planDuration?: 'monthly' | 'yearly' | 'lifetime' | 'custom';
	gstNumber?: string;

	// Status & tracking
	status: 'pending' | 'succeeded' | 'failed' | 'refunded';
	isRefunded?: boolean;
	refundedAmount?: number;
	refundReason?: string;
	paymentDate?: Date;
	description?: string;

	// Raw response from gateway
	rawResponse?: any;

	createdAt: Date;
	updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
	organizationId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Organization',
		required: true
	},
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},

	gateway: {
		type: String,
		enum: ['stripe', 'razorpay', 'manual'],
		required: true
	},
	gatewayPaymentId: {
		type: String,
		required: true
	},
	gatewayOrderId: {
		type: String
	},
	paymentMethod: {
		type: String,
		required: true
	},

	amount: {
		type: Number,
		required: true
	},
	taxPercent: {
		type: Number,
		default: 0
	},
	taxAmount: {
		type: Number,
		default: 0
	},
	discountType: {
		type: String,
		enum: ['flat', 'percentage']
	},
	discountValue: {
		type: Number
	},
	discountAmount: {
		type: Number,
		default: 0
	},
	totalAmount: {
		type: Number,
		required: true
	},
	currency: {
		type: String,
		default: 'INR'
	},

	invoiceNumber: {
		type: String,
		unique: true,
		sparse: true
	},
	billingPeriod: {
		start: { type: Date },
		end: { type: Date }
	},
	planName: { type: String },
	planDuration: {
		type: String,
		enum: ['monthly', 'yearly', 'lifetime', 'custom']
	},
	gstNumber: {
		type: String
	},

	status: {
		type: String,
		enum: ['pending', 'succeeded', 'failed', 'refunded'],
		required: true
	},
	isRefunded: {
		type: Boolean,
		default: false
	},
	refundedAmount: {
		type: Number,
		default: 0
	},
	refundReason: {
		type: String
	},
	paymentDate: {
		type: Date
	},
	description: {
		type: String
	},
	rawResponse: {
		type: Schema.Types.Mixed
	},
	createdAt: {
		type: Date,
		default: Date.now
	},
	updatedAt: {
		type: Date,
		default: Date.now
	}
});

export const Payment: Model<IPayment> = mongoose.model<IPayment>('Payment', PaymentSchema);
