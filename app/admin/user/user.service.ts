import* as userModel from '../../common/models/user.model';
import bcrypt from 'bcryptjs'
import * as roleModel from '../../common/models/roles.model';
import { formatTime } from '../../common/helper/formatTIme';


export const createUser = async (data: any) => {
	const saltRounds = 10;

	// Handle password
	if (data.password && typeof data.password === 'string') {
		data.password = bcrypt.hashSync(data.password, saltRounds);
	} else {
		delete data.password;
	}

	const result = await userModel.User.create(data);
	return result;
}


export const UpdateUserByID = async (data: any) => {
	const saltRounds = 10;

	// Handle password
	if (data.password && typeof data.password === 'string') {
		data.password = bcrypt.hashSync(data.password, saltRounds);
	} else {
		delete data.password;
	}

	const updateSet: any = { ...data };
	delete updateSet.id;
	delete updateSet.role;
	delete updateSet.categories;

	const updateQuery: any = {
		$set: updateSet
	};

	// Prepare $addToSet for roles and categories
	if (data.role) {
		const roleArray = Array.isArray(data.role) ? data.role : [data.role];
		updateQuery.$set.role = roleArray;
	}

	if (data.categories) {
		const categoryArray = Array.isArray(data.categories) ? data.categories : [data.categories];
		updateQuery.$set.categories = categoryArray;
	}

	const result = await userModel.User.findByIdAndUpdate(
		data.id,
		updateQuery,
		{ new: true }
	);

	return result;
};




export const getAllUsers = async () => {
	const result = await userModel.User.find({}).sort({ createdAt: -1 }).select('id first_name email role level categories status profile_img createdAt updatedAt')
	.populate('role', 'role_name')		
	.populate('categories', 'title')
	return result
}

export const getUserByID = async (id: string) => {
	const result = await userModel.User.findById(id).select('id first_name email role level categories status profile_img createdAt updatedAt')
		.populate('role', 'role_name')
		.populate('categories', 'title')
	return result
}

export const getAllUsersByRole = async () => {
	const result = await userModel.User.find({status: true})
		.select('id first_name email role level categories status profile_img createdAt updatedAt')
		.populate({ path: 'role', select: 'role_name' })
		.populate('categories', 'title')

	// Fix: Support multiple roles by checking if any role has role_name === 'AGENT'
	const agents = result.filter((user: any) =>
		Array.isArray(user.role)
			? user.role.some((r: any) => r.role_name === 'AGENT')
			: user.role?.role_name === 'AGENT'
	)

	
	return agents.map((user: any) => ({
		_id: user.id,
		first_name: user.first_name,
		email: user.email,
		role: user.role,
		level: user.level,
		categories:user.categories,
		status: user.status=== true ? 'Active' : 'Inactive',	
		createdAt: formatTime(user.createdAt),
	}));
}

export const getUserByEmail = async (email: string) => {
	const result = await userModel.User.findOne({ email })
	return result
}


export const activate_DeactivateUser = async (id: string, status: boolean) => {
	// check if the user is already active or inactive
	const user = await userModel.User.findById(id)
	if(!user) {
		throw new Error('User not found')
	}
	if(user.status === true){
		const result = await userModel.User.findByIdAndUpdate({_id: id}, { status: false }, { new: true })
		return result
	}
	const result = await userModel.User.findByIdAndUpdate({_id: id}, { status: true }, { new: true })
	return result
}


export const makeAdmin = async (id: string) => {
	const roles = await roleModel.Role.findOne({role_name: 'ADMIN'})
	if(!roles){
		throw new Error('Admin role not found')
	}
	// check if the user is already an admin  and remove the admin role
	const user = await userModel.User.findById(id)
	if(!user) {
		throw new Error('User not found')
	}
	
	const userRoleIds = Array.isArray(user.role) 
		? user.role.map((role: any) => role.toString())
		: [user.role?.toString()].filter(Boolean)
		
	if(userRoleIds.includes(roles._id.toString())){
		const result = await userModel.User.findByIdAndUpdate({_id: id}, { $pull: { role: roles._id } }, { new: true })
		return result
	}
	
	const result = await userModel.User.findByIdAndUpdate({_id: id}, { $push: { role: roles._id } }, { new: true })
	return result
}



