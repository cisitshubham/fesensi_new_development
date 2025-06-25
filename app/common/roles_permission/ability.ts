import { Request, Response } from 'express'
import {Role} from '../models/roles.model'
import {Permission} from '../models/permission.model'

export const assignPermissionsToRole = async (req: Request, res: Response) => {
	try {
		const { roleId } = req.body
		if (!roleId) return res.status(400).json({ message: 'roleId is required' })

		const role = await Role.findOne({ _id: roleId })
		if (!role) return res.status(404).json({ message: 'Role not found' })

		const permissions = await Permission.find({ _id: { $in: role.permissions } }) as { _id: string }[]
		const permissionIds: string[] = permissions.map(p => p._id.toString())

		role.permissions = [...new Set([...role.permissions.map((id: { toString: () => any }) => id.toString()), ...permissionIds])]
		await role.save()
		return res.status(200).json({ message: 'Permissions assigned successfully', role })
	} catch (error) {
		return res.status(500).json({ message: 'Internal server error', error: error })
	}
}