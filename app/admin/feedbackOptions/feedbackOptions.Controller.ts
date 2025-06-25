import { Request, Response } from 'express'
import { createResponse, createErrorResponse, createEmptyResponse, } from '../../common/helper/response.helper'
import { Result } from 'express-validator'
import asyncHandler from 'express-async-handler'
import * as resolvedPost from './feedbackOptions.service'

export const createfeedbackOption= asyncHandler(
	async (req:Request,res:Response)=>{
		const data =req.body
		const user = req.user;
		req.body.creator=(user as any)._id;
		const result = await resolvedPost.CreateFeedbackOptions(data)
		if(!result){
			res.send(createErrorResponse(403,'Failed to create Post'))
		}
		res.send(createResponse(result, 'Post has been created.'))
	}
);

export const getFeedbackOptions= asyncHandler(
	async (req:Request,res:Response)=>{
		const response = await resolvedPost.GetFeedbackOptions();
		if(!response.length){
			res.send(createEmptyResponse())
		}
		res.send(createResponse(response,'Data Loaded'))
	}
)

export const UpdateFeedbackOptions = asyncHandler(
	async (req:Request,res:Response)=>{
		const {id}=req.params;
		const { title } =req.body
		const response = await resolvedPost.updateFeedbackOptions(id, title);
		if (!response) {
			res.send(createErrorResponse(403, 'Failed to update Post'))
		}
		res.send(createResponse(response, 'Post has been updated.'))
	}
);

export const deleteFeedbackOptions = asyncHandler(
	async (req:Request,res:Response)=>{
		const  {id} = req.params
		const response = await resolvedPost.deleteFeedbackOptions(id);
		if (!response) {
			res.send(createErrorResponse(403, 'Failed to delete Post'))
		}
		res.send(createResponse(response, 'Post has been deleted'))
	}
)