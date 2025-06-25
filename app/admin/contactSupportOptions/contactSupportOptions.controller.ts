import { createContactSupportOptions, getContactSupportOptions, updateContactSupportOptions, deleteContactSupportOptions } from "./contactSupportOptions.service";
import { Request, Response } from "express";
import { createResponse, createErrorResponse, createEmptyResponse } from "../../common/helper/response.helper";
import asyncHandler from 'express-async-handler'



export const createContactSupportOptionsController = asyncHandler(async (req:Request,res:Response)=>{
	const {title} = req.body
	const user = (req as any).user
	const userId = user._id
	const response = await createContactSupportOptions(title,userId)
	 res.status(200).json(createResponse(response,"Contact support options created successfully"))
	return
})

export const getContactSupportOptionsController = asyncHandler(async (req:Request,res:Response)=>{
	const response = await getContactSupportOptions()
	res.status(200).json(createResponse(response,"Data Loaded"))
	return
})

export const updateContactSupportOptionsController = asyncHandler(async (req:Request,res:Response)=>{
	const {id} = req.params
	const {title} = req.body
	const response = await updateContactSupportOptions(id,title)
	res.status(200).json(createResponse(response,"Contact support options updated successfully"))
	return
})

export const deleteContactSupportOptionsController = asyncHandler(async (req:Request,res:Response)=>{
	const {id} = req.params
	const response = await deleteContactSupportOptions(id)
	res.status(200).json(createResponse(response,"Contact support options deleted successfully"))
	return
})









