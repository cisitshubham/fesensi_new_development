import mongoose ,{Schema,Document,Model} from 'mongoose'

export interface IDepartments extends Document {
	name: string;
	status: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export const DepartmnentSchema: Schema = new Schema({
  name: { type: String, required: true },
  status: { type: Boolean,  default: true }, 
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const Department: Model<IDepartments> = mongoose.model<IDepartments>('departments', DepartmnentSchema);