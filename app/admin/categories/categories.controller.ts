import { Request, Response } from 'express'
import { createResponse, createErrorResponse } from '../../common/helper/response.helper'
import asyncHandler from 'express-async-handler'
import { Result } from 'express-validator'
import * as categoriesService from './categories.service'
import {getAllLevels} from '../level/level.service';

export const createCategories = asyncHandler(async (req:Request,res:Response) => {

	const getLevels = await getAllLevels();
	const getLevelsIds = getLevels.map(level => level._id);
	const user = (req as any).user;
	const { title } = req.body;

	let data ={
		title: title,
		levels: getLevelsIds,
        created_by: user._id,
	}
	const category = await categoriesService.createCategories(data);
	if(!category){
		res.send(createErrorResponse(400, "Error creating categories"));
	}
	res.send(createResponse(category,"Category created successfully"));
});

export const getAllCategories = asyncHandler(async (req:Request,res:Response) => {
    const categories = await categoriesService.getAllCategories();
	if(!categories||!categories.length){
		res.send(createErrorResponse(404,'Data not found.'));
	}
    res.send(createResponse(categories,"Data loaded"));
});


export const updateCategories = asyncHandler(async (req:Request,res:Response) => {
	const { id } = req.params;
	const { title } = req.body;
	const updatedCategories = await categoriesService.updateCategories(id, title);
	res.send(createResponse(updatedCategories,"Categories updated successfully"));
});


export const deleteCategories = asyncHandler(async (req:Request,res:Response) => {
	const { id } = req.params;
	const deletedCategories = await categoriesService.deleteCategories(id);
	res.send(createResponse(deletedCategories,"Categories deleted successfully"));
});


