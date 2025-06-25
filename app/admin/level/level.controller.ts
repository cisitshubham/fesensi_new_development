import { Request, Response } from 'express'
import { createResponse, createErrorResponse } from '../../common/helper/response.helper'
import asyncHandler from 'express-async-handler'
import { Result } from 'express-validator'
import * as levelService from './level.service'

export const createLevels = asyncHandler(async (req: Request, res: Response) => {
	
    let data={
        name:"L3",
        status:'ACTIVE',
    }
   let result = await levelService.createLevel(data);
   if (!result) {
        res.status(400).json(createErrorResponse(400, 'Failed to create level'))
        return;
    }
   res.status(201).json(createResponse(result, 'Level created successfully'))
});

export const getAllLevels = asyncHandler(async (req: Request, res: Response) => {
	const levels = await levelService.getAllLevels();
    if (!levels || !levels.length) {
        res.status(404).json(createErrorResponse(404, 'Data not found'))
        return;
    }
    res.status(200).json(createResponse(levels))
});
