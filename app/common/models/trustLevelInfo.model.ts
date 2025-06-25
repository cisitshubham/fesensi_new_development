import mongoose from 'mongoose';
import { Schema ,Document} from 'mongoose';

interface ITrustLevelInfo extends Document {
	level: string;
	levelInfo: string;
	min: number;
	weights: {
		rating: number;
		sla: number;
		notResolved: number;
		responseTime: number;
	};
}

const TrustLevelInfoSchema = new Schema({
	level: { type: String, required: true },
	levelInfo: { type: String, required: true },
	min: { type: Number, required: true },
	weights:{
		rating: { type: Number, default: 0.4 },
		sla: { type: Number, default: 0.3 },
		notResolved: { type: Number, default: 0.2 },
		responseTime: { type: Number, default: 0.1 },
	},
}, { timestamps: true });

const TrustLevelInfo = mongoose.model<ITrustLevelInfo>('TrustLevelInfo', TrustLevelInfoSchema);
export default TrustLevelInfo;
