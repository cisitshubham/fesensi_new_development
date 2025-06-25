import { esclation } from '../common/models/escaltion.model';


export const createEscalation = async (data: any, session?: any) => {
	const result = await esclation.create([data]);
	return result[0]; 
};


export const getEscalation = async (data: any) => {
	const result = await esclation.findOne(data);
    return result;
}

export const getEscalationById = async (id: string) => {
	const result = await esclation.findById(id);
	return result;
}



