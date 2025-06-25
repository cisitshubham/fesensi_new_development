import { ContactSupportOptions } from "../../common/models/contactSupport.options.model";

export const createContactSupportOptions= async (title:string,createdBy:string)=>{
	const response = await ContactSupportOptions.create({title,createdBy})
	return response;
}

export const getContactSupportOptions= async ()=>{
	const response = await ContactSupportOptions.find({})
	return response;
}

export const getContactSupportOptionsByStatus= async (status:boolean)=>{
	const response = await ContactSupportOptions.find().select('title _id')
	return response.map((item:any)=>({
		_id: item._id,
		title: item.title
	}));
}

export const updateContactSupportOptions= async (id:string,title:string)=>{
	const response = await ContactSupportOptions.findByIdAndUpdate(id,{title},{new:true})
	return response;
}


export const deleteContactSupportOptions= async (id:string)=>{
	const response = await ContactSupportOptions.findByIdAndDelete(id)
	return response;
}




