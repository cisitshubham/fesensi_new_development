import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import * as userService from '../../user/user.service'
import createHttpError from 'http-errors'
import expressAsyncHandler from 'express-async-handler'

interface AuthenticatedRequest extends Request {
	user?: any;
}


export const authenticate = expressAsyncHandler(
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const token = req.headers.authorization?.replace('Bearer ', '')

        if (!token) {
            throw createHttpError(401, {
                message: `invalid token or expired token`,
            })
        }

        const decodedUser = jwt.verify(token, process.env.JWT_SECRET!) as {
            _id: string
        }

        if (!decodedUser) {
            throw createHttpError(401, {
                message: `invalid token or expired token`,
            })
        }

        const user = await userService.getUserById(decodedUser._id)
        if (!user) {
            throw createHttpError(401, {
                message: `invalid token or expired token`,
            })
        }
		req.user = user; 
        next()
    }
)




// export const authenticate = expressAsyncHandler(
// 	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
// 		const token = req.headers.authorization?.replace("Bearer ", "");
// 		if (!token) {
// 			throw createHttpError(401, { message: "Invalid token" });
// 		}

// 		const decodedUser = jwt.verify(token, process.env.JWT_SECRET!) as { _id: string };

// 		if (!decodedUser) {
// 			throw createHttpError(401, { message: "Invalid token" });
// 		}

// 		const user = await userService.getUserById(decodedUser._id);
// 		if (!user) {
// 			throw createHttpError(401, { message: "Invalid token" });
// 		}

// 		req.user = user; 
// 		next();
// 	}
// );
