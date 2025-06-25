import {Plan,IPlan,PlanDuration} from '../models/plans.model';
import { formatTime } from '../../common/helper/formatTIme'



export const plansDuration = () => {
	const duaration = PlanDuration;
	return duaration;
}
export const createPlans = async (data:IPlan) => {
	const plan = await Plan.create(data);
	return plan;
};

export const getPlans = async () => {
	const plans = await Plan.find( { status: true },);
	return plans.map(plan => {
		return {
			_id: plan._id,
			name: plan.name,
			rate: plan.rate,
			duration: plan.duration,
			status: plan.status,
			createdBy: plan.createdBy,
			createdAt: formatTime(plan.createdAt),
			updatedAt: formatTime(plan.updatedAt)
		};
	});
	
};

export const getPlanById = async (id: string) => {
	const plan = await Plan.findById(id)
		.select('-__v -updatedAt')
		.populate<{ createdBy: { _id: string; first_name: string; email: string } }>('createdBy', 'first_name email')
		.lean();
	if (!plan) {
		throw new Error('Plan not found');
	}

	if (!plan.status) {
		throw new Error('Plan is inactive or unavailable');
	}
	return plan
		? {
			_id: plan._id,
			name: plan.name,
			rate: plan.rate,
			duration: plan.duration,
			status: plan.status,
			createdBy: plan.createdBy
				? {
					_id: (plan.createdBy as any)._id,
					first_name: (plan.createdBy as any).first_name,
					email: (plan.createdBy as any).email
				}
				: null,
			createdAt: formatTime(plan.createdAt),
			updatedAt: formatTime(plan.updatedAt)
		}
		: null;
	;
};

export const updatePlan = async (id:string, data:IPlan) => {
	const plan = await Plan.findByIdAndUpdate
	(id, data,{ new: true } );
	return plan
		? {
			_id: plan._id,
			name: plan.name,
			rate: plan.rate,	
			duration: plan.duration,
			status: plan.status,
			createdBy: plan.createdBy,
			createdAt: formatTime(plan.createdAt),
			updatedAt: formatTime(plan.updatedAt)
			}
		: null;
}

// activate or deactivate a plan
export const togglePlanStatus = async (id:string) => {
	const plan = await Plan.findById(id );
	if (!plan) {
		throw new Error('Plan not found');
	}
	plan.status = plan.status ===false ? true : false;
	plan.updatedAt = new Date();
	await plan.save();
	return {
		_id: plan._id,
		name: plan.name,
		rate: plan.rate,
		duration: plan.duration,
		status: plan.status,
		createdBy: plan.createdBy,
		createdAt: formatTime(plan.createdAt),
		updatedAt: formatTime(plan.updatedAt)
	};
}

export const getPlanByName = async (name: string) => {
	const plan = await Plan.findOne({ name: name.toLowerCase(), status: true });
	if (!plan) {
		return null;
	}
	return {
		_id: plan._id,
		name: plan.name,
		rate: plan.rate,
		duration: plan.duration,
		status: plan.status,
		createdBy: plan.createdBy,
		createdAt: formatTime(plan.createdAt),
		updatedAt: formatTime(plan.updatedAt)
	};
};