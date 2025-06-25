
import { Document, model, Schema } from 'mongoose'
export interface IResolvedPost extends Document {
	title: String,
	creator: Schema.Types.ObjectId,
}

const ResolvedPostSchema = new Schema(
	{
		title:String,
		creator: Schema.Types.ObjectId,
	},
	{
		timestamps: true,
	}
)

export const ResolvedPosts = model<IResolvedPost>('ResolvedPosts', ResolvedPostSchema)
