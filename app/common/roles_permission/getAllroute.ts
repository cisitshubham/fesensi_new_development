import express from 'express'
import {Role} from '../models/roles.model'
import {Permission} from '../models/permission.model'


export function extractRoutes(router: express.Application | express.Router) {
	const routes: string[] = []
	const stack = (router as any)._router?.stack || (router as any).stack
	if (!stack || !Array.isArray(stack)) {
		console.warn('No valid route stack found')
		return routes
	}
	function processStack(stack: any[], prefix = '') {
		stack.forEach((layer) => {
			if (layer.route) {
				const path = prefix + layer.route.path
				const methods = Object.keys(layer.route.methods)
				methods.forEach((method) => {
					routes.push(`${method.toLowerCase()}:${path}`)
				})
			} else if (layer.name === 'router' && layer.handle.stack) {
				const newPrefix = layer.regexp?.source
					?.replace(/^\\\//, '/')
					.replace(/\\\/\?/g, '/')
					.replace(/\(\?:\(\[\^\\\/]\+\?\)\)/g, ':param')
					.replace(/\\\//g, '/') || ''
				processStack(layer.handle.stack, prefix + newPrefix)
			}
		})
	}

		processStack(stack)
		const uniqueRoutes = Array.from(new Set(routes))
		const result = saveRoutesToDatabase(uniqueRoutes)
		if (result) {console.log(result) }
	
	}


const getRoleFromPath = (path: string): string => {
	const segment = path.split('/')[0]?.toLowerCase()
	if (segment === 'admin') return 'ADMIN'
	if (segment === 'agent') return 'AGENT'
	if (segment === 'tickets'  ) return 'CUSTOMER'
	if (segment === 'users') return 'AUTH'
	return 'Unknown'
}

export const saveRoutesToDatabase = async (routes: string[]) => {
	const permissionPromises = routes.map(async (route) => {
		const [method, rawPath] = route.split(':')
		const cleanedPath = rawPath
			.replace(/^(\^)?\/?/, '')               // Remove leading ^ or /
			.replace(/\(\?\=.+?\)/g, '')            // Remove lookaheads
			.replace(/\(\?:.+?\)/g, '')             // Remove non-capturing groups
			.replace(/\\\//g, '/')                  // Unescape slashes
			.replace(/\(\[\^\\\/]\+\?\)/g, ':param') // Handle dynamic segments
			.replace(/\/+/g, '/')                   // Collapse multiple slashes
			.replace(/\/$/, '')                     // Remove trailing slash


		const pathWithoutMethod = cleanedPath.toLowerCase()
		const permissionName = `${pathWithoutMethod}`
		const role = getRoleFromPath(pathWithoutMethod)

		const exists = await Permission.findOne({ name: permissionName })
		if (!exists) {
			await new Permission({
				name: permissionName,
				method: method.toUpperCase(),  // optional
				role: role,                    // store role name
			}).save()
		}
	})

	await Promise.all(permissionPromises)
}