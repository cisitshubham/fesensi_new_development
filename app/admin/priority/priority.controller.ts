import { Request, Response } from 'express'
import { createResponse, createErrorResponse, createEmptyResponse, } from '../../common/helper/response.helper'
import* as priorityService from './priority.service'
import asyncHandler from 'express-async-handler'

export const createPriorities =async (req: Request, res: Response) => {
	const { title, esclationHrs, responseHrs, colourCode  } = req.body;
	const user=req.user;
	const creator=(user as any)._id;
	let data={
		name:title,
		esclationHrs: esclationHrs,
		responseHrs: responseHrs,
		colourCode: colourCode,
		creator,
		status:'ACTIVE',
	}
	const priority = await priorityService.createPriorities(data)
    res.send(createResponse(priority, 'Priority created successfully'))
    return;
}


export const updatePriorities =async (req: Request, res: Response) => {
	const { title, esclationHrs, responseHrs, colourCode } = req.body;
	const {id}=req.params
	const user = req.user;
	const creator = (user as any)._id;
	let data={
		name:title,
		esclationHrs,
		responseHrs:responseHrs,
		colourCode:colourCode,
		creator,
		status:'ACTIVE',
	}	
	const priority = await priorityService.updatePriorty(id,data)
    res.send(createResponse(priority, 'Priority updated successfully'))
    return;
}

export const getPriorities = asyncHandler(async (req: Request, res: Response) => {
	const priorities = await priorityService.getAllPriorities()
	if (!priorities || !priorities.length) {
        res.send(createErrorResponse(404, 'Data not found'))
        return;
    }
    res.send(createResponse(priorities))
})

export const getPriorityByID = asyncHandler(async (req: Request, res: Response) => {
	const { id } = req.params;
	const priority = await priorityService.getPriorityByID(id);
	res.send(createResponse(priority));
});	

export const deletePriorities = asyncHandler(async (req: Request, res: Response) => {
	const id = req.params.id;
	const priorities = await priorityService.deletePriority(id);

	if (!priorities) {
		 res.send(createErrorResponse(422, 'Failed delete! Please try again later'));
		return;
	}

	res.send(createResponse(priorities, 'Record has been deleted.'));
});



