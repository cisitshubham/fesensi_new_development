import { Request, Response } from 'express'
import { createResponse, createErrorResponse, createEmptyResponse, } from '../../common/helper/response.helper'
import asyncHandler from 'express-async-handler'
import * as dashboardIcon from '../dashboard-icon/dashboard-icon.service'
import { Result } from 'express-validator'


export const CreateDashICon=asyncHandler(
 async	(req:Request,res:Response)=>{
		let data = {
			name:'ASSIGNED',
			icon: `${process.env.APP_URL }/images/dashboard-icon/assigned.svg`,
			status:'Active'
		};
		const result = await dashboardIcon.createDashboardIcon(data);
		if (!result) {
			res.status(404).send(createErrorResponse(400, "Icon not found"));
			return;
		}
	   res.send(createResponse(result, 'Icon Created'))
});

export const GetDashIcons=asyncHandler(
 async    (req:Request,res:Response)=>{
	    const result = await dashboardIcon.getAllDashboardIcons();
		if (!result || result.length === 0) {
            res.status(404).send(createErrorResponse(400, "No icons found"));
            return;
        }
		res.send(createResponse(result, 'Data Loaded'))
});