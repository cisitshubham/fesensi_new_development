import { query, body, param, checkExact } from 'express-validator';



export const createPlanValidation = [
	 body('name')
		.exists({ checkFalsy: true }).withMessage('Name is required')
		.bail()
		.isString().withMessage('Name must be a string'),
	  body('rate')
		.exists({ checkFalsy: true }).withMessage('Rate is required')
		.bail()
		.isNumeric().withMessage('Rate must be a number'),

	 body('duration')
		.exists({ checkFalsy: true }).withMessage('Duration is required')
		.bail()
		.isArray().withMessage('Duration must be an array')
		.bail()
		.custom((value) => {
			if (value.length === 0) {
				throw new Error('Duration must not be empty');
			}
			if (typeof value[0] !== 'string' || value[0].trim().length === 0) {
				throw new Error('Duration value must be a non-empty string');
			}
			return true;
		}),
];



export const updatePlanValidation = [
	body('name').isString().withMessage('Name must be a string'),
	body('rate').isNumeric().withMessage('Price must be a number'),
	body('duration')
		.isArray()
		.withMessage('Duration must be an array')
		.custom((value) => {
			if (value.length > 1) {
				throw new Error('Duration must contain only one value');
			}
			return true;
		})
		.custom((value) => {
			if (value.length === 1 && value[0] <= 0) {
				throw new Error('Duration must be greater than 0');
			}
			return true;
		}),
];