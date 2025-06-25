export enum PlanDuration {
	MONTH = 'month',
	YEAR = 'year',
	LIFETIME = 'lifetime',
	SIX_MONTHS = '6_months',
	TWO_YEARS = '2_years',
	THREE_YEARS = '3_years',
	FOUR_YEARS = '4_years'
}

interface PlanCommitment {
	planName: string;
	planDuration: PlanDuration;
	noOfAgent: number;
}

interface PlanPricingOptions {
	basePricePerAgentPerMonth: number; // e.g. ₹200
	discountPercent?: number; // e.g. 10 = 10%
	taxPercent?: number; // e.g. 18 = 18% GST
}

const getDurationInMonths = (duration: PlanDuration): number => {
	switch (duration) {
		case PlanDuration.MONTH:
			return 1;
		case PlanDuration.SIX_MONTHS:
			return 6;
		case PlanDuration.YEAR:
			return 12;
		case PlanDuration.TWO_YEARS:
			return 24;
		case PlanDuration.THREE_YEARS:
			return 36;
		case PlanDuration.FOUR_YEARS:
			return 48;
		case PlanDuration.LIFETIME:
			return 60; // treat as 5 years or fixed cap
		default:
			throw new Error('Invalid plan duration');
	}
};

export const calculatePlanCost = (plan: PlanCommitment,pricing: PlanPricingOptions) => {
	const months = getDurationInMonths(plan.planDuration);
	const baseAmount = pricing.basePricePerAgentPerMonth * plan.noOfAgent * months;

	const discount = pricing.discountPercent
		? (baseAmount * pricing.discountPercent) / 100
		: 0;

	const subtotal = baseAmount - discount;

	const tax = pricing.taxPercent
		? (subtotal * pricing.taxPercent) / 100
		: 0;

	const total = subtotal + tax;

	return {
		baseAmount: parseFloat(baseAmount.toFixed(2)),
		discount: parseFloat(discount.toFixed(2)),
		tax: parseFloat(tax.toFixed(2)),
		total: parseFloat(total.toFixed(2)),
		durationInMonths: months
	};
};
