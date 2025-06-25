import { Document, model, Schema } from 'mongoose'

export interface ICategories extends Document {
	
	title: string
	levels:{
		    type: Schema.Types.ObjectId,
            ref: 'Level',           
        },
	created_by:{
		    type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        }
	
}

const categories = new Schema(
	{
		title:{
			type: String,
            required: true,
            trim: true,
		},
		levels:[{
			type: Schema.Types.ObjectId,
			ref: 'Levels',           
        }],
		
		created_by:{
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        }

	},
	{
		timestamps: true,
	}
)

export const Categories = model<ICategories>('Categories', categories)
