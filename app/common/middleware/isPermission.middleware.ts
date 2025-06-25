import { role } from './../../admin/admin.validator';
import { Request, Response, NextFunction } from 'express'
import { Role } from '../models/roles.model'
import { Permission } from '../models/permission.model'

export const checkPermission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	try {		
		const user = req.user as any
		
		if (!user?.role || !Array.isArray(user.role)) {
			res.status(403).json({ message: 'No roles assigned' })
			return
		}

		const roleIds = user.role.map((r: any) => r._id || r) // support populated or raw _id

		const roles = await Role.find({ _id: { $in: roleIds } })
		.populate('permissions')		
		if (!roles.length) {
			res.status(403).json({ message: 'No valid roles found' })
			return
		}

		const method = req.method.toUpperCase()
		const path = req.route?.path || req.originalUrl.split('?')[0]
		const cleanedPath = path
						.replace(/^(\^)?\/?/, '')               // Remove leading ^ or /
						.replace(/\(\?\=.+?\)/g, '')            // Remove lookaheads
						.replace(/\(\?:.+?\)/g, '')             // Remove non-capturing groups
						.replace(/\\\//g, '/')                  // Unescape slashes
						.replace(/\(\[\^\\\/]\+\?\)/g, ':param') // Handle dynamic segments
						.replace(/\/+/g, '/')                   // Collapse multiple slashes
						.replace(/\/$/, '')                     // Remove trailing slash
						.replace(/^api\//, '')                  // Remove 'api/' at the start of the path	
							
		for (const role of roles) {
			const match = role.permissions.find((perm: any) => perm.name === cleanedPath && perm.method === method)			
			if (match) {
				return next() 
			}
		}

		res.status(403).json({status:403, message: 'Forbidden: You do not have permission to access this resource.' })
	} catch (error) {
		console.error(error)
		res.status(500).json({ message: 'Internal server error' })
	}
}
