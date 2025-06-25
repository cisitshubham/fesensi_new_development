import { SLA } from '../common/models/sla.models';


export const createSLA = async (data: any, session: any) => {
	const result = await SLA.create([data], { session }); 
	return result[0];
};

export const getSLA = async (data: any) => {
	const result = await SLA.findOne(data);
	return result;
};

export const getSLAById = async (id: string) => {
	const result = await SLA.findById(id);
	return result;
};

export const updateSLA = async (id: string, data: any) => {
	const result = await SLA.findByIdAndUpdate(id, data, { new: true });
	return result;
};

export const deleteSLA = async (id: string) => {
	const result = await SLA.findByIdAndDelete(id);
	return result;
};