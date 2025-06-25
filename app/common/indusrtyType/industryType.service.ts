import { formatTime } from '../../common/helper/formatTIme'
import {IndustryType ,IIndustryType} from '../models/industryType.model'

export const createIndustryType = async (data:IIndustryType) => {
  const industryType = new IndustryType({
	...data,
  });
  await industryType.save();
  return industryType;
}

export const createBulkIndustryType = async (data: IIndustryType[]) => {
  const industryTypes = data.map(item => ({
	...item,
  }));
  await IndustryType.insertMany(industryTypes);
  return industryTypes;
}

export const getIndustryTypes = async (query: any) => {
  const industryTypes = await IndustryType.find(query).sort({ createdAt: -1 });
  return industryTypes;
}

export const getIndustryTypeById = async (id: string) => {
  const industryType = await IndustryType.findById(id);
  return industryType;
}

export const updateIndustryType = async (id: string, data: Partial<IIndustryType>) => {
  const updatedData = {
	...data,
	updatedAt: Date.now()
  };
  const industryType = await IndustryType.findByIdAndUpdate(id, updatedData, { new: true });
  return industryType;
}

export const deleteIndustryType = async (id: string) => {
  const industryType = await IndustryType.findByIdAndDelete(id);
  return industryType;
}

export const toggleIndustryTypeStatus = async (id: string) => {
	  const industryType = await IndustryType.findById(id);
  if (!industryType) {
	throw new Error('Industry type not found');
	  }
	    industryType.status = industryType.status ? false : true;
	return industryType;
}

export const getDetailsByName = async (name:string)=>{
	const industryType = await IndustryType.findOne({name:name}).select('name description status');
	return industryType;
}

