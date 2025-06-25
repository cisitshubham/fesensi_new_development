import * as IndustryTypeService from './industryType.service';
import { Request, Response } from 'express';
import { IPlan } from '../models/plans.model';
import { createResponse, createErrorResponse, createEmptyResponse, } from '../helper/response.helper'
import asyncHandler from 'express-async-handler'
import { IIndustryType } from './../models/industryType.model';
import path from 'path';
import fs from 'fs';
import XLSX from 'xlsx';


export const createIndustryType = asyncHandler(async (req: Request, res: Response) => {
   const data: IIndustryType = req.body;
   const industryType = await IndustryTypeService.createIndustryType(data);
   if (!industryType) {
	  res.status(400).json(createErrorResponse(400,'Failed to create industry type'));
	  return;
   }
   res.status(200).json(createResponse(industryType, 'Industry type created successfully'));
   return;
});

export const downloadIndustryTypesTemplate = asyncHandler(async (req: Request, res: Response) => {
	const filePath = path.join(__dirname, '../../../public/importFormats/fesensi_industry_types_template.xlsx');
	if (!fs.existsSync(filePath)) {
		res.status(404).json(createErrorResponse(404, 'Template file not found'));
		return;
	}
	res.download(filePath, 'industryTypesTemplate.xlsx', (err) => {
		if (err) {
			res.status(500).json(createErrorResponse(500, 'Failed to download template'));
		}
	});

});


export const createBulkIndustryType = asyncHandler(async (req: Request, res: Response) => {
	const filePath = req.file?.path;

	if (!filePath) {
		res.status(400).json(createErrorResponse(400, 'File not uploaded'));
		return;
	}

	const fileExtension = path.extname(filePath);
	if (fileExtension !== '.xlsx') {
		fs.unlinkSync(filePath); // clean up
		res.status(400).json(createErrorResponse(400, 'Invalid file type. Only .xlsx (Excel) is allowed'));
		return;
	}

	const workbook = XLSX.readFile(filePath);
	const sheetName = workbook.SheetNames[0];
	const worksheet = workbook.Sheets[sheetName];

	const data: IIndustryType[] = XLSX.utils.sheet_to_json(worksheet, {
		range: 2, 
		header: ['name', 'status'],
		defval: '', 
	});
	  
	fs.unlinkSync(filePath);
	if (!data || data.length === 0) {
		res.status(400).json(createErrorResponse(400, 'Excel contains no data'));
		return;
	}
	const industryTypes = await IndustryTypeService.createBulkIndustryType(data);

	if (!industryTypes) {
		res.status(400).json(createErrorResponse(400, 'Failed to create industry types'));
		return;
	}

	res.status(200).json(createResponse(industryTypes, 'Industry types created successfully'));
});
export const getIndustryTypes = asyncHandler(async (req: Request, res: Response) => {
	const query = req.query;
	const industryTypes = await IndustryTypeService.getIndustryTypes(query);
	if (!industryTypes || industryTypes.length === 0) {
		res.status(404).json(createEmptyResponse());
		return;
	}
	res.status(200).json(createResponse(industryTypes, 'Industry types retrieved successfully'));
});

export const getIndustryTypeById = asyncHandler(async (req: Request, res: Response) => {
	const id = req.params.id;
	const industryType = await IndustryTypeService.getIndustryTypeById(id);
	if (!industryType) {
		res.status(404).json(createErrorResponse(404, 'Industry type not found'));
		return;
	}		
	res.status(200).json(createResponse(industryType, 'Industry type retrieved successfully'));
});

export const updateIndustryType = asyncHandler(async (req: Request, res: Response) => {
	const id = req.params.id;
	const data: Partial<IIndustryType> = req.body;
	const exsist = await IndustryTypeService.getDetailsByName( data.name as string);
	if(exsist){
		res.status(400).json(createErrorResponse(400, 'Industry type already exists.'));
	}
	const industryType = await IndustryTypeService.updateIndustryType(id, data);
	if (!industryType) {
		res.status(404).json(createErrorResponse(404, 'Industry type not found'));
		return;
	}
	res.status(200).json(createResponse(industryType, 'Industry type updated successfully'));
});


export const deleteIndustryType = asyncHandler(async (req: Request, res: Response) => {
	const id = req.params.id;
	const industryType = await IndustryTypeService.deleteIndustryType(id);
	if (!industryType) {
		res.status(404).json(createErrorResponse(404, 'Industry type not found'));
		return;
	}
	res.status(200).json(createResponse(industryType, 'Industry type deleted successfully'));
});

export const toggleIndustryTypeStatus = asyncHandler(async (req: Request, res: Response) => {
	const id = req.params.id;
	const industryType = await IndustryTypeService.toggleIndustryTypeStatus(id);
	if (!industryType) {
		res.status(404).json(createErrorResponse(404, 'Industry type not found'));
		return;
	}
	await industryType.save();
	res.status(200).json(createResponse(industryType, 'Industry type status toggled successfully'));
});

export const getIndustryTypeByName = asyncHandler(async (req: Request, res: Response) => {
	const name = req.params.name;
	const industryType = await IndustryTypeService.getIndustryTypes({ name });
	if (!industryType || industryType.length === 0) {
		res.status(404).json(createErrorResponse(404, 'Industry type not found'));
		return;
	}
	res.status(200).json(createResponse(industryType[0], 'Industry type retrieved successfully'));
});
