import { Reassignments} from '../../common/models/reassignmentOptions'

export const CreateReAssignmentOptions = async (data:any)=>{
	const result = await Reassignments.create(data);
	return result;
}

export const GetReAssignmentOptions = async ()=>{
	const result= await Reassignments.find().select('title');
	return result;
}



export const updateReAssignmentOptions = async (id:string,data:any)=>{
	const result =await Reassignments.findByIdAndUpdate({_id:id},{title:data});
	return result;
}

export const deleteReAssignmentOptions = async (id:string)=>{
	const result = await Reassignments.findByIdAndDelete({_id:id});
	return result;
}