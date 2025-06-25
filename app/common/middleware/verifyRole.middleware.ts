import { Request, Response, NextFunction, RequestHandler } from 'express'

export const authorizeRoles = (...allowedRoleIds: string[]): RequestHandler => {
	return (req: Request, res: Response, next: NextFunction): void => {
		const user = req.user as any
		
		if (!user?.role || !Array.isArray(user.role)) {
			res.status(403).json({ message: 'Forbidden: Invalid role format' })
			return
		}
		const userRoleIds = user.role.map((r: any) => r._id.toString())
		const hasRole = userRoleIds.some((roleId: string) => allowedRoleIds.includes(roleId))			
		if (!hasRole) {
			res.status(403).json({ message: `Forbidden: You don't have permission to access this url` })
			return
		}
		next()
	}
}
