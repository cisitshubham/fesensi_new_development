import bcrypt from 'bcryptjs'
import { IUser } from './user.dto'
import { User } from '../common/models/user.model'
import { getAllRoles } from '../admin/roles/roles.service'

export const createUser = async (data: any) => {
	const saltRounds = 10
	const password = data.password
	const hashedPassword = bcrypt.hashSync(password, saltRounds)
	data.password = hashedPassword
	const result = await User.create(data)
	return result
}

export const UpdateUserByID = async (data: any) => {
	// Format numeric values to ensure they are floats
	if (data.trustScore !== undefined) {
		data.trustScore = Number(data.trustScore.toFixed(2));
	}
	if (data.metrics) {
		Object.keys(data.metrics).forEach(key => {
			if (typeof data.metrics[key] === 'number') {
				data.metrics[key] = Number(data.metrics[key].toFixed(2));
			}
		});
	}

	const result = await User.findByIdAndUpdate(data._id, data, { new: true }).populate('role', 'role_name');
	return result;
}

export const getUserByEmail = async (email: string) => {
	const result = await User.findOne({ email }).populate('role', 'role_name');
    return result
}

export const getUserById = async (id: string) => {
	const result = await User.findById(id).select('first_name level status profile_img').populate({ path:'categories',select:'title'}).populate('role', 'role_name');
    return result
}

export const getAlluser=async ()=>{
	const result = await User.find().select('first_name level status profile_img ').populate({ path: 'categories', select: 'title' }).populate('role', 'role_name');
	return result;
}

export const IsUserVerify=async(email:string)=>{
	   const result=await User.findOneAndUpdate({email:email},{status:true});
	   return result;
}

export const forgetPassword = async (email: string, OTP: number ) => {
	const result = await User.findOneAndUpdate({ email }, { otp: OTP ,lastOtpRequestTime:new Date()});
	return result;
}

export const resetPassword = async ( OTP: number, password: string) => {	
	const saltRounds = 10
	const hashedPassword = bcrypt.hashSync(password, saltRounds)
	const result= await User.findOneAndUpdate({otp:OTP }, { password: hashedPassword,otp:null },{new:true}).select('email');
	return result;
}

export const profileUpdate = async (userId: string, data: string) => {
	let result = await User.findByIdAndUpdate(userId, { $set: { profile_img: data } }, { new: true } );
	return result;
};

export const getAssinUserByRole= async () => {
	const role = await getAllRoles()
	const agentRole = role.find((r: any) => r.role_name === 'AGENT')
	if (!agentRole) return [];
	const result = await User.find({ role: agentRole._id, status: true }).select('_id first_name last_name');
    return result;
}

export const getUserByLevel = async (data:any) =>{
	const result = await User.findOne({ level: data?.level, categories: { $in: [data?.categoryID] }, status: true }).select('_id first_name last_name level');
    return result;
}

export const roleVerify = async (userId: string) => {
	const userDoc = await User.findOne({ _id: userId }).select('first_name role ' ).populate('role', 'role_name');
	if (!userDoc) return false;
	const isAgent = Array.isArray(userDoc.role)
		? userDoc.role.some((r: any) => r.role_name === 'AGENT')
		: false;
	const user = userDoc.toObject(); 
	(user as any).isAgent = isAgent;
	return user;
};

// get Admin by role name
export const getAdminByRole = async () => {
	const role = await getAllRoles()
	const adminRole = role.find((r: any) => r.role_name === 'ADMIN')
	if (!adminRole) return [];
	const result = await User.find({ role: adminRole._id, status: true }).select('_id first_name last_name');
	return result;
}