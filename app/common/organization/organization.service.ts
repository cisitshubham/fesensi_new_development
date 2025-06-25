import {Organization,IOrganization} from '../models/organization.model'
import { formatTime } from './../helper/formatTIme';

export const onBoardOrganization = async (data:IOrganization)=>{
	const result = Organization.create( data);
	return result;
}

export const GetOrganizationByEmail = async (orgEmail:string)=>{
	const result = await Organization.findOne({orgEmail:orgEmail});
	return result;
}

export const getOrganizationByContact = async (orgContact:string)=>{
	const result = await Organization.findOne({ orgContact:orgContact});
	return result;
}