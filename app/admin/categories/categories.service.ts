import { Categories } from '../../common/models/categories.model'
import { Level } from '../../common/models/level.model'


export const createCategories = async (data:any)=>{
	let result= await Categories.create(data);
	if(!result) {
		throw new Error('Error creating category');
	}
    return result;
};

export const getAllCategories = async () => {
	let result = await Categories.find().select('_id title');
	return result || [];
}


export const getAllCategoriesByCategoryId = async ( data:string)=>{ 
	const result = await Categories.findOne({ _id: data })
		.populate({ path: 'levels', select: 'name', options: { lean: true } })
		.lean();
	const levelName = result?.levels ? (result.levels as any).name : null;
	if (!result) {
		throw new Error('Error fetching categories by ID');
	}
	(result as any).level = levelName ?? null ;	
	return result;
}

export const updateCategories = async (id:string, title:string)=>{
	const result = await Categories.findByIdAndUpdate(id, { title }, { new: true });
	if(!result) {
		throw new Error('Error updating categories');
	}
	return result;
}

export const deleteCategories = async (id:string)=>{
	const result = await Categories.findByIdAndDelete(id);
	if(!result) {
		throw new Error('Error deleting categories');
	}
	return result;
}



