import { Request, Response } from 'express'
import { createResponse, createErrorResponse, createEmptyResponse, } from '../../common/helper/response.helper'
import { Result } from 'express-validator'
import* as  Status from './status.service'
import asyncHandler from 'express-async-handler'

export const createStatus =async (req: Request, res: Response) => {
	const { title } = req.body;
	let data={
		name:"IN-PROGRESS",
		status:'ACTIVE',
	}
	const priority = await Status.createStatus(data)
	res.status(201).json(createResponse(priority, 'Status created successfully'))
	return;
}

export const getAllStatus = asyncHandler(async (req: Request, res: Response) => {
	const priorities = await Status.getAllStatus()
	if (!priorities || !priorities.length) {
		res.status(404).json(createErrorResponse(404, 'Data not found'))
		return;
	}
	res.status(200).json(createResponse(priorities))
})

