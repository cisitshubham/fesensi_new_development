import { Feedback, IFeedback } from '../common/models/feedback.model';
import { SLA } from '../common/models/sla.models';
import * as UserService from '../user/user.service';
import * as priorityService from '../admin/priority/priority.service';
import { ITicket } from '../ticket/ticket.dto';
import TrustLevelInfo from '../common/models/trustLevelInfo.model';

type PopulatedFeedback = IFeedback & {
	ticket: ITicket;
};

interface TrustLevel {
	min: number;
	level: string;
	levelInfo: string;
}

const DEFAULT_WEIGHTS = {
	rating: 0.4,
	sla: 0.3,
	notResolved: 0.2,
	responseTime: 0.1
};

const DEFAULT_TRUST_LEVELS: TrustLevel[] = [
	{ min: 4.5, level: 'Excellent', levelInfo: 'Outstanding performance with exceptional service quality' },
	{ min: 4.0, level: 'Good', levelInfo: 'Consistently good performance with high service quality' },
	{ min: 3.0, level: 'Average', levelInfo: 'Meets basic service requirements with room for improvement' },
	{ min: 0.0, level: 'Needs Improvement', levelInfo: 'Performance below expectations, requires immediate attention' }
];

const getTrustLevelInfo = async () => {
	const trustLevelInfo = await TrustLevelInfo.find().sort({ min: -1 });
	if (!trustLevelInfo || trustLevelInfo.length === 0) {
		return {
			weights: DEFAULT_WEIGHTS,
			levels: DEFAULT_TRUST_LEVELS
		};
	}

	return {
		weights: trustLevelInfo[0].weights,
		levels: trustLevelInfo.map(level => ({
			min: level.min,
			level: level.level,
			levelInfo: level.levelInfo
		}))
	};
};

export const calculateTrustScore = async (agentId: string) => {
	const { weights: WEIGHTS, levels: TRUST_LEVELS } = await getTrustLevelInfo();

	const feedbacks = await Feedback.find({ feedbackfor: agentId }).populate('ticket');

	const slaConfigs = await SLA.find();
	if (!slaConfigs || slaConfigs.length === 0) {
		throw new Error('No SLA configurations found');
	}

	const ticketsWithMetrics = await Promise.all(feedbacks.map(async (fb: any) => {
		const ticket = fb.ticket as ITicket & { updatedAt: Date };
		const priorityId = ticket.priority?.toString();
		if (!priorityId) return null;

		const sla = slaConfigs.find(s => s.priority?.toString() === priorityId);

		const createdAt = new Date(ticket.createdAt);
		const resolvedAt = new Date(ticket.updatedAt);
		const hoursToResolve = (resolvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
		const slaCompliant = sla ? hoursToResolve <= sla.resolution_time : false;

		const responseTimeScore = sla ? Math.max(0, 1 - (hoursToResolve / (sla.resolution_time * 2))) : 0;

		return {
			rating: Number(fb.rating) || 0,
			resolvedAt,
			slaCompliant,
			notResolvedByUser: Boolean(fb.notResolvedByUser),
			responseTimeScore
		};
	}));

	const validTickets = ticketsWithMetrics.filter((t): t is NonNullable<typeof t> => t !== null);
	const total = validTickets.length;

	const formatNumber = (num: number): number => Math.round(num);

	if (total === 0) {
		const emptyResponse = {
			score: 0,
			scoreOutOf100: 0,
			level: 'Needs Improvement',
			recencyFactor: 0,
			levelInfo: 'Performance below expectations, requires immediate attention',
			maxNumber: 100,
			metrics: {
				totalTickets: 0,
				totalRatings: 0,
				avgRating: 0,
				slaCompliantCount: 0,
				notResolvedCount: 0,
				avgResponseTimeScore: 0
			}
		};
		return emptyResponse;
	}

	const totalRatings = feedbacks.reduce((sum, fb) => sum + (Number(fb.rating) || 0), 0);
	const avgRating = totalRatings / total;

	const slaCount = validTickets.filter(t => t.slaCompliant).length;
	const slaRate = slaCount / total;

	const notResolvedCount = validTickets.filter(t => t.notResolvedByUser).length;
	const notResolvedRate = notResolvedCount / total;

	const recencyFactor = calculateRecencyFactor(validTickets);

	const trustScore = (
		(WEIGHTS.rating * avgRating) +
		(WEIGHTS.sla * slaRate * 5) +
		(WEIGHTS.notResolved * (1 - notResolvedRate) * 5) +
		(WEIGHTS.responseTime * (validTickets.reduce((sum, t) => sum + t.responseTimeScore, 0) / total) * 5)
	) * recencyFactor;

	const normalizedScore = trustScore * 20;

	const trustLevel = TRUST_LEVELS.find(l => trustScore >= l.min)?.level || 'Needs Improvement';

	const avgResponseTimeScore = validTickets.reduce((sum, t) => sum + t.responseTimeScore, 0) / total;

	const metrics = {
		totalTickets: formatNumber(total),
		totalRatings: formatNumber(totalRatings),
		avgRating: formatNumber(avgRating),
		slaCompliantCount: formatNumber(slaCount),
		notResolvedCount: formatNumber(notResolvedCount),
		avgResponseTimeScore: formatNumber(avgResponseTimeScore)
	};

	await UserService.UpdateUserByID({
		_id: agentId,
		trustScore: formatNumber(trustScore),
		trustLevel,
		metrics
	});

	const response = {
		score: formatNumber(trustScore),
		scoreOutOf100: formatNumber(normalizedScore),
		level: trustLevel || 'Needs Improvement',
		recencyFactor: formatNumber(recencyFactor * 100),
		maxNumber: 100,
		levelInfo: TRUST_LEVELS.find(l => l.level === trustLevel)?.levelInfo || '',
		metrics
	};

	return response;
};

function calculateRecencyFactor(tickets: { rating: number; resolvedAt: Date }[]) {
	const now = Date.now();
	const decayRate = 0.001;
	let weightedSum = 0;
	let totalWeight = 0;

	tickets.forEach(t => {
		const ageDays = (now - new Date(t.resolvedAt).getTime()) / (1000 * 60 * 60 * 24);
		const weight = Math.exp(-decayRate * ageDays);
		weightedSum += t.rating * weight;
		totalWeight += weight;
	});

	return totalWeight === 0 ? 1 : (weightedSum / totalWeight) / 5;
}

// create trust level info
export const createTrustLevelInfo = async (data: any) => {
	const { level, levelInfo, min, rating, sla, notResolved, responseTime } = data;
	const trustLevelInfo = await TrustLevelInfo.create({
		level,
		levelInfo,
		min,
		weights: {
			rating,
			sla,
			notResolved,
			responseTime
		}
	});
	return trustLevelInfo;
};

// get all trust level info
export const getAllTrustLevelInfo = async () => {
	const trustLevelInfo = await TrustLevelInfo.find().select('-__v');
	return trustLevelInfo;
};

// get trust level info by id
export const getTrustLevelInfoById = async (id: string) => {
	const trustLevelInfo = await TrustLevelInfo.findById(id);
	return trustLevelInfo;
};

// update trust level info by id
export const updateTrustLevelInfoById = async (id: string, data: any) => {
	const trustLevelInfo = await TrustLevelInfo.findByIdAndUpdate(id, data, { new: true });
	return trustLevelInfo;
};

// delete trust level info by id
export const deleteTrustLevelInfoById = async (id: string) => {
	const trustLevelInfo = await TrustLevelInfo.findByIdAndDelete(id);
	return trustLevelInfo;
};

