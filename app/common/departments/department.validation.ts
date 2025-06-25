import {body,query,param,check,checkExact} from 'express-validator';


export const createDepartmentValidation = checkExact([
	body('name')
		.notEmpty().withMessage('Name is required')
		.bail()
		.isString().withMessage('Name must be a string')
		.bail()
		.custom((value) => {
			if (value.length > 50) {
				throw new Error('Name must not exceed 50 characters');
			}
			if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
				throw new Error('Name must only contain letters, numbers, underscores (_) or hyphens (-) without spaces');
			}
			return true;
		}),

	body('status')
		.optional()
		.isBoolean().withMessage('Status must be a boolean'),
]);

export const updateDepartmentTypeValidation = checkExact([
	body('name')
		.optional()
		.isString().withMessage('Name must be a string')
		.bail()
		.custom((value) => {
			if (value.length > 50) {
				throw new Error('Name must not exceed 50 characters');
			}
			if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
				throw new Error('Name must only contain letters, numbers, underscores (_) or hyphens (-) without spaces');
			}
			return true;
		}),

	body('status')
		.optional()
		.isBoolean().withMessage('Status must be a boolean'),
]);

export const bulkCreate = checkExact([
	body('file')
		.custom((value, { req }) => {
			if (!req.file) {
				throw new Error('File is required');
			}

			const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
			if (!allowedTypes.includes(req.file.mimetype)) {
				throw new Error('Only Excel files (.xlsx, .xls) are allowed');
			}

			return true;
		}),
]);