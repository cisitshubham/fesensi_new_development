import { Request, Response } from 'express'
import { createResponse, createErrorResponse, createEmptyResponse, } from '../../common/helper/response.helper'
import { Result } from 'express-validator'
import asyncHandler from 'express-async-handler'
import * as ReAssignmentSerivece from './reAssignmentsOptions.service'

export const createReassignoption= asyncHandler(
	async (req:Request,res:Response)=>{
		const data =req.body
		const user = req.user;
		req.body.creator=(user as any)._id;
		const result = await ReAssignmentSerivece.CreateReAssignmentOptions(data)
		if(!result){
			res.send(createErrorResponse(403,'Failed to create'))
		}
		res.send(createResponse(result, 'Re-Assign Option has been  created.'))
	}
);

export const GetReassignoption= asyncHandler(
	async (req:Request,res:Response)=>{
		const response = await ReAssignmentSerivece.GetReAssignmentOptions();
		if(!response.length){
			res.send(createEmptyResponse())
		}
		res.send(createResponse(response,'Data Loaded'))
	}
)

export const UpdateReassignoption = asyncHandler(
	async (req:Request,res:Response)=>{
		const {id}=req.params;
		const { title } =req.body
		const response = await ReAssignmentSerivece.updateReAssignmentOptions(id, title);
		if (!response) {
			res.send(createErrorResponse(403, 'Failed to update Post'))
		}
		res.send(createResponse(response, 'Re-Assign Option has been  updated.'))
	}
);

export const deleteReassignoption = asyncHandler(
	async (req:Request,res:Response)=>{
		const  {id} = req.params
		const response = await ReAssignmentSerivece.deleteReAssignmentOptions(id);
		if (!response) {
			res.send(createErrorResponse(403, 'Failed to delete'))
		}
		res.send(createResponse(response, 'Re-Assign Option has been deleted.'))
	}
)