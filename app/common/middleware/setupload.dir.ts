import { Request, Response, NextFunction } from "express";

export const setUploadFolder = (folderName: string) => {
	return (req: Request, res: Response, next: NextFunction) => {
		req.body.folder = folderName; 		
		next();
	};
};
