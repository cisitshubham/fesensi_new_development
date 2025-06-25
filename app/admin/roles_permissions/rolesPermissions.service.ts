import { role } from './../admin.validator';
import { Role } from '../../common/models/roles.model'
import { Permission } from '../../common/models/permission.model'



export const assignPermissionsToRole = async (data: { roleId: string, permissions: string[] }) => {
	const { roleId, permissions } = data;
	const role = await Role.findById(roleId);
	if (!role) throw new Error('Role not found');
	
	const validPermissions = await Permission.find({ _id: { $in: permissions } }) as { _id: string }[];		
	const validPermissionIds = validPermissions.map(p => p._id.toString());
	
	// Check if all provided permission IDs are valid
	if (validPermissionIds.length !== permissions.length) {
		throw new Error('Some permission IDs are invalid');
	}

	// Check for duplicates and only add new permissions
	const existingPermissions = role.permissions || [];
	const newPermissions = validPermissionIds.filter(id => !existingPermissions.includes(id));
	
	// Merge existing and new permissions without duplicates
	role.permissions = [...existingPermissions, ...newPermissions];
	await role.save();
	return role;
}


export const getAllPermissions = async () => {
	const permissions = await Permission.find({}) 
	return permissions;
}

export const getPermissionById = async (data: { roleId: string, permissions: string[] })=>{
	const { permissions, roleId } = data;
	const permission = await Role.find({_id:roleId,permissions:{$in: permissions}}).select('name permissions')	
	return permission;
}

// delete permission from role	
export const deletePermissionFromRole = async (data: { roleId: string, permissionId: string }) => {
	const { roleId, permissionId } = data;
	const role = await  Role.findByIdAndUpdate({_id:roleId},{$pull:{permissions:{$in:permissionId}}}, {new:true})
	return role;
}
