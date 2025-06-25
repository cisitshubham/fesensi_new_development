import * as plansService from './plans.service';
import { Request, Response } from 'express';
import { IPlan } from '../models/plans.model';
import { createResponse, createErrorResponse, createEmptyResponse, } from '../helper/response.helper'
import asyncHandler from 'express-async-handler'

export const plansDuration = asyncHandler(async (req: Request, res: Response) => {
	const durations = await plansService.plansDuration();
	if (!durations) {
		res.status(404).json(createEmptyResponse());
		return;
	}	
	res.status(200).json(createResponse(durations, 'Plan durations retrieved successfully'));
});

export const createPlan = asyncHandler(async (req: Request, res: Response) => {
	const user = req.user as any;
	const userId = user._id;
	const planData: IPlan = req.body;
	planData.createdBy = userId;
	planData.name = planData.name.toLocaleLowerCase().trim();
	const existingPlan = await plansService.getPlanByName(planData.name);
	if (existingPlan) {
		res.status(400).json(createErrorResponse(400, 'Plan with this name already exists'));
		return;
	}
	const newPlan = await plansService.createPlans(planData);
	if (!newPlan) {
		res.status(500).json(createErrorResponse(500, 'Failed to create plan'));
		return;
	}
	res.status(201).json(createResponse(newPlan, 'Plan created successfully'));
});

export const getPlans = asyncHandler(async (req: Request, res: Response) => {
	const plans = await plansService.getPlans();
	if (!plans || plans.length === 0) {
		res.status(404).json(createEmptyResponse());
		return;
	}
	res.status(200).json(createResponse(plans, 'Plans retrieved successfully'));
});

export const getPlanById = asyncHandler(async (req: Request, res: Response) => {
	const planId = req.params.id;
	const plan = await plansService.getPlanById(planId);
	if (!plan) {
		res.status(404).json(createErrorResponse(404, 'Plan not found'));
		return;
	}
	res.status(200).json(createResponse(plan, 'Plan retrieved successfully'));
});

export const updatePlan = asyncHandler(async (req: Request, res: Response) => {
	const planId = req.params.id;
	const planData: IPlan = req.body;
	planData.name = planData.name.toLocaleLowerCase().trim();
	const existingPlan = await plansService.getPlanByName(planData.name);
	if (existingPlan && existingPlan._id.toString() !== planId) {
		res.status(400).json(createErrorResponse(400, 'Plan with this name already exists'));
		return;
	}
	const updatedPlan = await plansService.updatePlan(planId, planData);
	if (!updatedPlan) {
		res.status(500).json(createErrorResponse(500, 'Failed to update plan'));
		return;
	}
	res.status(200).json(createResponse(updatedPlan, 'Plan updated successfully'));
});

export const togglePlanStatus = asyncHandler(async (req: Request, res: Response) => {
	const planId = req.params.id;
	const updatedPlan = await plansService.togglePlanStatus(planId);
	if (!updatedPlan) {
		res.status(404).json(createErrorResponse(404, 'Plan not found'));
		return;
	}
	const statusMessage = updatedPlan.status ? 'activated' : 'deactivated';
	res.status(200).json(createResponse(updatedPlan, `Plan ${statusMessage} successfully`));
});

export const getPlanByName = asyncHandler(async (req: Request, res: Response) => {
	const planName = req.params.name.toLocaleLowerCase().trim();
	const plan = await plansService.getPlanByName(planName);
	if (!plan) {
		res.status(404).json(createErrorResponse(404, 'Plan not found'));
		return;
	}
	res.status(200).json(createResponse(plan, 'Plan retrieved successfully'));
});