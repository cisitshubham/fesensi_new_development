import { Priorities } from '../../common/models/priority.model'

export const createPriorities = async (data: any) => {
	let result = await Priorities.create(data);
	if(!result) {
		throw new Error('Error creating priority');
	}
	return result;
}

export const getAllPriorities = async () => {
	let result = await Priorities.find()
		.select('_id name esclationHrs responseHrs');
	if(!result.length) {
		throw new Error('Error fetching priorities');
	}
	return result;
}

export const getPriorityByID= async (_id:string) => {
	let result = await Priorities.findById(_id)
		.select('_id name esclationHrs responseHrs');
	if(!result) {
		throw new Error('Error fetching priority by ID');
	}
    return result;
}

export const updatePriorty= async (_id:string,data:any)=>{			
	let response = await Priorities.findByIdAndUpdate({ _id: _id }, { name: data.name, creator: data.creator, esclationHrs: data.esclationHrs });
	return response;
}

export const deletePriority= async (_id:string)=>{
	let response = await Priorities.findByIdAndDelete({_id:_id});
	return response;
}