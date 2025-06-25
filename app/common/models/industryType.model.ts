import mongoose, {Schema , Document,Model} from 'mongoose';

export interface IIndustryType extends Document {
  name: string;
  status: boolean; 
  createdAt: Date;
  updatedAt: Date;
}

export const IndustryTypeSchema: Schema = new Schema({
  name: { type: String, required: true },
  status: { type: Boolean,  default: true }, 
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const IndustryType: Model<IIndustryType> = mongoose.model<IIndustryType>('industryTypes', IndustryTypeSchema);