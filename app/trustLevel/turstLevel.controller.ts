import { Request, Response } from 'express';
import * as trustLevelService from './trustLevel.service';
import { createResponse, createEmptyResponse } from '../common/helper/response.helper';
import { IUser } from '../user/user.dto';
import asyncHandler from 'express-async-handler'

export const getTrustLevel = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user as IUser;
	const agentId = user?._id?.toString();
    if (!agentId) {
        res.send(createEmptyResponse());
        return;
    }
    const trustLevel = await trustLevelService.calculateTrustScore(agentId);
	if (!trustLevel) {
		res.send(createEmptyResponse());
		return;
	}
    res.send(createResponse(trustLevel, 'Trust level calculated successfully'));
});

// create trust level info
export const createTrustLevelInfo = asyncHandler(async (req: Request, res: Response) => {
	const { level, levelInfo, min, rating, sla, notResolved, responseTime } = req.body;
	const trustLevelInfo = await trustLevelService.createTrustLevelInfo({ level, levelInfo, min, rating, sla, notResolved, responseTime });
	if (!trustLevelInfo) {
		res.send(createEmptyResponse());
		return;
	}
	res.send(createResponse(trustLevelInfo, 'Trust level info created successfully'));
});


// get all trust level info
export const getTrustLevelInfo = asyncHandler(async (req: Request, res: Response) => {
	const trustLevelInfo = await trustLevelService.getAllTrustLevelInfo();
	if (!trustLevelInfo) {
		res.send(createEmptyResponse());
		return;
	}
	res.send(createResponse(trustLevelInfo, 'Trust level info fetched successfully'));
});

// get trust level info by id
export const getTrustLevelInfoById = asyncHandler(async (req: Request, res: Response) => {
	const { id } = req.params;
	const trustLevelInfo = await trustLevelService.getTrustLevelInfoById(id);
	if (!trustLevelInfo) {
		res.send(createEmptyResponse());
		return;
	}
	res.send(createResponse(trustLevelInfo, 'Trust level info fetched successfully'));
});

// update trust level info by id
export const updateTrustLevelInfoById = asyncHandler(async (req: Request, res: Response) => {
	const { id } = req.params;
	const { level, levelInfo, min, rating, sla, notResolved, responseTime } = req.body;
	const trustLevelInfo = await trustLevelService.updateTrustLevelInfoById(id, { level, levelInfo, min, rating, sla, notResolved, responseTime });
	if (!trustLevelInfo) {
		res.send(createEmptyResponse());
		return;
	}
	res.send(createResponse(trustLevelInfo, 'Trust level info updated successfully'));
});

// delete trust level info by id
export const deleteTrustLevelInfoById = asyncHandler(async (req: Request, res: Response) => {
	const { id } = req.params;
	const trustLevelInfo = await trustLevelService.deleteTrustLevelInfoById(id);
	if (!trustLevelInfo) {
		res.send(createEmptyResponse());
		return;
	}
	res.send(createResponse(trustLevelInfo, 'Trust level info deleted successfully'));
});



