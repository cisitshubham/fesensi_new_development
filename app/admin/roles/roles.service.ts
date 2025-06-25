import {Role} from '../../common/models/roles.model';


export const createRole = async (data: any) => {
	const role = new Role(data);
	return await role.save();
}

export const getAllRoles = async () => {
	return await Role.find({}).sort({ createdAt: -1 });
}

export const getRoleById = async (id: string) => {
    return await Role.findById(id);
}

export const updateRole = async (id: string, data: any) => {
    const role = await Role.findByIdAndUpdate(id, data, { new: true });
    return role;
}

export const deleteRole = async (id: string) => {
	return await Role.findByIdAndDelete(id);
}
