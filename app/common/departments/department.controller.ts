import * as departmentService from './department.service';
import { Request, Response } from 'express';
import { createResponse, createErrorResponse, createEmptyResponse, } from '../helper/response.helper'
import asyncHandler from 'express-async-handler'
import { IDepartments } from '../models/departments.model';	
import path from 'path';
import fs from 'fs';
import XLSX from 'xlsx';


export const createDepartment = asyncHandler(async (req: Request, res: Response) => {
   const data: IDepartments = req.body;
	const Department = await departmentService.createDepartment(data);
   if (!Department) {
	   res.status(400).json(createErrorResponse(400,'Failed to create Department'));
	  return;
   }
	res.status(200).json(createResponse(Department, 'Department created successfully'));
   return;
});

export const downloadDepartmentTemplate = asyncHandler(async (req: Request, res: Response) => {
	const filePath = path.join(__dirname, '../../../public/importFormats/fesensi_departments_template.xlsx');
	if (!fs.existsSync(filePath)) {

		res.status(404).json(createErrorResponse(404, 'Template file not found'));
		return;
	}
	res.download(filePath, 'DepartmentTemplate.xlsx', (err) => {
		if (err) {
			res.status(500).json(createErrorResponse(500, 'Failed to download template'));
		}
	});

});


export const createBulkDepartment = asyncHandler(async (req: Request, res: Response) => {
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

	const data: IDepartments[] = XLSX.utils.sheet_to_json(worksheet, {
		range: 2, 
		header: ['name', 'status'],
		defval: '', 
	});
	  
	fs.unlinkSync(filePath);
	if (!data || data.length === 0) {
		res.status(400).json(createErrorResponse(400, 'Excel contains no data'));
		return;
	}
	const Department = await departmentService.createBulkDepartment(data);

	if (!Department) {
		res.status(400).json(createErrorResponse(400, 'Failed to create Department!'));
		return;
	}

	res.status(200).json(createResponse(Department, 'Department created successfully'));
});

export const getDepartment = asyncHandler(async (req: Request, res: Response) => {
	const query = req.query;
	const Department = await departmentService.getDepartments(query);
	if (!Department || Department.length === 0) {
		res.status(404).json(createEmptyResponse());
		return;
	}
	res.status(200).json(createResponse(Department, 'Department retrieved successfully'));
});

export const getDepartmentById = asyncHandler(async (req: Request, res: Response) => {
	const id = req.params.id;
	const Department = await departmentService.getDepartmentById(id);
	if (!Department) {
		res.status(404).json(createErrorResponse(404, 'Department not found'));
		return;
	}		
	res.status(200).json(createResponse(Department, 'Department retrieved successfully'));
});

export const updateDepartment = asyncHandler(async (req: Request, res: Response) => {
	const id = req.params.id;
	const data: Partial<IDepartments> = req.body;
	const exsist = await departmentService.getDetailsByName( data.name as string);
	if(exsist){
		res.status(400).json(createErrorResponse(400, 'Department already exists.'));
	}
	const Department = await departmentService.updateDepartment(id, data);
	if (!Department) {
		res.status(404).json(createErrorResponse(404, 'Department not found'));
		return;
	}
	res.status(200).json(createResponse(Department, 'Department updated successfully'));
});


export const deleteDepartment = asyncHandler(async (req: Request, res: Response) => {
	const id = req.params.id;
	const Department = await departmentService.deleteDepartment(id);
	if (!Department) {
		res.status(404).json(createErrorResponse(404, 'Department not found'));
		return;
	}
	res.status(200).json(createResponse(Department, 'Department deleted successfully'));
});

export const toggleDepartmentStatus = asyncHandler(async (req: Request, res: Response) => {
	const id = req.params.id;
	const Department = await departmentService.toggleDepartmentStatus(id);
	if (!Department) {
		res.status(404).json(createErrorResponse(404, 'Department not found'));
		return;
	}
	await Department.save();
	res.status(200).json(createResponse(Department, 'Department status changed successfully'));
});

export const getDepartmentByName = asyncHandler(async (req: Request, res: Response) => {
	const name = req.params.name;
	const Department = await departmentService.getDetailsByName(name);
	if (!Department ) {
		res.status(404).json(createErrorResponse(404, 'Department not found'));
		return;
	}
	res.status(200).json(createResponse(Department, 'Department retrieved successfully'));
});
