import { Status } from '../../common/models/status.models'

export const createStatus = async (data: any) => {
	let result = await Status.create(data);
	return result;
}

export const getAllStatus = async () => {
	// follow the order OPEN ,IN-PROGRESS,RESOLVED CLOSED
	const statusOrder = ['OPEN', 'IN-PROGRESS', 'RESOLVED', 'CLOSED'];
	let result = await Status.find().select('_id name');	
	// Sort the results based on the predefined order
	result.sort((a, b) => {
		return statusOrder.indexOf(a.name) - statusOrder.indexOf(b.name);
	});
	
	return result;
}