import { body, Result } from 'express-validator';
import { Request, Response } from 'express'
import { createResponse, createErrorResponse, createEmptyResponse, } from '../../common/helper/response.helper'
import * as rolesPermissionsService from './rolesPermissions.service'
import asyncHandler from 'express-async-handler'


export const assignPermissionsToRole = asyncHandler(async (req: Request, res: Response) => {
	const { roleId, permissions } = req.body;
	if (!roleId || !permissions) {
		res.send(createErrorResponse(400, 'RoleId and permissions are required'));
		return;
	}

	const permissionsArray = permissions.map((permission: { _id: any; }) =>
		permission._id ? permission._id : permission
	) as string[];

	const data = {
		roleId,
		permissions: permissionsArray
	};
	
	try {
		const role = await rolesPermissionsService.assignPermissionsToRole(data);
		if (!role) {
			res.send(createErrorResponse(404, 'Role not found'));
			return;
		}

		res.send(createResponse(role, 'Permissions synced successfully'));
		return;
	} catch (error: any) {
		res.send(createErrorResponse(500, error.message || 'Error assigning permissions'));
		return;
	}
});

export const getAllPermissions = asyncHandler(async (req: Request, res: Response) => {
	const permissions = await rolesPermissionsService.getAllPermissions()
	if (!permissions || !permissions.length) {
		res.send(createErrorResponse(404, 'Data not found'))
		return;
	}
	res.send(createResponse(permissions))
})

// delete multiple permissions 
export const deletePermissionsFromRole = asyncHandler(async (req: Request, res: Response) => {
	const { roleId, permissionId } = req.body;		
	if (!roleId || !permissionId) {
		res.send(createErrorResponse(400, 'RoleId and permissionId are required'));
		return;
	}
	const data = { roleId, permissionId };
	try {
		const role = await rolesPermissionsService.deletePermissionFromRole(data);
		if (!role) {
			res.send(createErrorResponse(404, 'Role not found'));
			return;
		}

		res.send(createResponse(role, 'Permission deleted successfully'));
		return;
	} catch (error: any) {
		res.send(createErrorResponse(500, error.message || 'Error deleting permission'));
		return;
	}
});	
