import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model";

export const isUserActive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	try {
		req.body.email = req.body.email?.toLowerCase(); 
		const user = await User.findOne({ email: req.body.email });

		if (!user) {
			res.status(404).json({ success: false, message: "User not found!" });
			return;
		}

		if (user.status !== true) { 
			res.status(403).json({
				success: false,
				message: user.status == null ? "Account not activated!" : "Account is not active!"
			});
			return;
		}

		next();
	} catch (error) {
		res.status(500).json({ success: false, error: (error as any).message });
	}
};
