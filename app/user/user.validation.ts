import { body, checkExact, header } from 'express-validator'

export const createUser = checkExact([
    body('email').notEmpty().isEmail().withMessage('Email is required'),
    body('password').notEmpty().isLength({ min: 6 }).withMessage('Password is required and must be at least 6 characters long'),
    body('first_name').notEmpty().withMessage('First name is required'),
    body('role').optional(),
	body('level').optional(),
	body('categories').optional(),
])

export const login = checkExact([
    body('email').notEmpty().isEmail().withMessage('Email is required'),
    body('password').notEmpty().isLength({ min: 6 }).withMessage('Password is required and must be at least 6 characters long'),
	body('fcm_token').optional(),
])


export const forgetPassword = checkExact([	
	body('email').notEmpty().isEmail().withMessage('Email is required'),
]);

export const resetPassword = checkExact([
	body('password').notEmpty().isLength({ min: 6 }).withMessage('Password is required and must be at least 6 characters long'),
	body('confirm_password').custom((value, { req }) => {
		if (value !== req.body.password) {
			throw new Error('Password confirmation does not match password');
		}
		return true;
	}),
	body('otp').notEmpty().withMessage('OTP is required'),
]);

export const logout =	checkExact([
	header('Authorization').notEmpty().withMessage('Authorization token is required'),
]);


export const profileUpdate=checkExact([
	body('image').notEmpty().withMessage('Image is required'),
]);

	