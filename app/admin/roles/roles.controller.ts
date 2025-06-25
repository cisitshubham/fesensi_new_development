import { Request, Response } from 'express'
import { createResponse, createErrorResponse, createEmptyResponse, } from '../../common/helper/response.helper'
import { Result } from 'express-validator'
import asyncHandler from 'express-async-handler'
import * as  roleService from './roles.service';

export const createRoles = asyncHandler(async (req: Request, res: Response) => {
	req.body.role_name = req.body.role_name?.toUpperCase();
	const result = await roleService.createRole(req.body)
	if (!result) {
         res.send(createErrorResponse(400, 'Failed to create role.'))
         return;
    }
	res.send(createResponse(result, 'Role created successfully.'))
});


export const getAllRoles = asyncHandler(async (req: Request, res: Response) => {
	const result = await roleService.getAllRoles()
	if (!result.length) {
		res.send(createEmptyResponse())
		return;
	}
	res.send(createResponse(result))
});

export const getRoleById = asyncHandler(async (req: Request, res: Response) => {
	const result = await roleService.getRoleById(req.params.id)
	if (!result) {
		res.send(createEmptyResponse())
		return;
	}
	res.send(createResponse(result))
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
	const result = await roleService.updateRole(req.params.id, req.body)
	if (!result) {
		res.send(createErrorResponse(400, 'Failed to update role.'))
		return;
	}
	res.send(createResponse(result, 'Role updated successfully.'))
});