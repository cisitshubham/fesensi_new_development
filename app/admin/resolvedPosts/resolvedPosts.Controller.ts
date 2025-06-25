import { Request, Response } from 'express'
import { createResponse, createErrorResponse, createEmptyResponse, } from '../../common/helper/response.helper'
import { Result } from 'express-validator'
import asyncHandler from 'express-async-handler'
import * as resolvedPost from './resolvedPost.service'

export const createResolvedPost= asyncHandler(
	async (req:Request,res:Response)=>{
		const data =req.body
		const user = req.user;
		req.body.creator=(user as any)._id;
		const result = await resolvedPost.CreateResolvedPost(data)
		if(!result){
			res.send(createErrorResponse(403,'Failed to create Post'))
		}
		res.send(createResponse(result, 'Post has been created.'))
	}
);

export const GetResolvedPost= asyncHandler(
	async (req:Request,res:Response)=>{
		const response = await resolvedPost.GetResolvedPost();
		if(!response.length){
			res.send(createEmptyResponse())
		}
		res.send(createResponse(response,'Data Loaded'))
	}
)

export const UpdateResolvedPost = asyncHandler(
	async (req:Request,res:Response)=>{
		const {id}=req.params;
		const { title } =req.body
		const response = await resolvedPost.updateResolvedPost(id, title);
		if (!response) {
			res.send(createErrorResponse(403, 'Failed to update Post'))
		}
		res.send(createResponse(response, 'Post has been updated.'))
	}
);

export const deleteResolvedPost = asyncHandler(
	async (req:Request,res:Response)=>{
		const  {id} = req.params
		const response = await resolvedPost.deleteResolvedPost(id);
		if (!response) {
			res.send(createErrorResponse(403, 'Failed to delete Post'))
		}
		res.send(createResponse(response, 'Post has been deleted'))
	}
)