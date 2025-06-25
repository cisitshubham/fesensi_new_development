import { Categories } from './../models/categories.model';
import { getAllCategories } from '../../admin/categories/categories.service';
import { getAllPriorities } from '../../admin/priority/priority.service';

// Ticket Chart's 



export const getCategoryCounts = async (tickets: any[]) => {
	const categories = await getAllCategories();
	const categoryTitles = categories.map(category => category.title);
	const categoryCounts: Record<string, number> = {};
	const inprogressList: any[] = [];
	const resolvedList: any[] = [];

	for (const category of categories) {
		const count = tickets.filter(ticket =>
			ticket.category.title === category.title
		).length;
		categoryCounts[category.title] = count;

		const inProgressCount = tickets.filter(ticket =>
			ticket.category.title === category.title &&
			ticket.status === 'IN-PROGRESS'
		).length;
		const resolvedCount = tickets.filter(ticket =>
			ticket.category.title === category.title &&
			ticket.status === 'RESOLVED'
		).length;
		inprogressList.push(inProgressCount);
		resolvedList.push(resolvedCount);

		
		
	}
	return { categories: categoryTitles, inprogress: inprogressList, resolved: resolvedList };
}




export const getTicketCountByPiority = async (tickets: any[]) => {
	const priorityCounts: Record< string , number> = {};
	const priorities = await getAllPriorities();
	for (const priority of priorities) {
		const count = tickets.filter(ticket =>
			ticket.priority.name === priority.name
		).length;
		priorityCounts[priority.name] = count;
		}
	return priorityCounts;
}

export const getTicketsByDateRange = (
	tickets: any[],
	from?: string,
	to?: string
) => {
	const parseDateStr = (str: string) => {
		if (str.includes('-')) return new Date(`${str}T00:00:00`);
		const [month, day, year] = str.split('/');
		return new Date(`${year}-${month}-${day}T00:00:00`);
	};

	const getValidDate = (str?: string) => {
		const today = new Date();
		const defaultStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
		return parseDateStr(str || defaultStr);
	};

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const fromDate = getValidDate(from);
	const toDate = getValidDate(to);
	toDate.setHours(23, 59, 59, 999);

	const isSingleToday =
		fromDate.getTime() === today.getTime() &&
		new Date(toDate).setHours(0, 0, 0, 0) === today.getTime();

	if (isSingleToday) {
		// Return hourly counts directly
		const slotCounts: Record<string, number> = {};
		for (let hour = 0; hour < 24; hour += 2) {
			const label = `${String(hour).padStart(2, '0')}:00 - ${String(hour + 2).padStart(2, '0')}:00`;
			slotCounts[label] = 0;
		}

		for (const ticket of tickets) {
			const createdAt = new Date(ticket.createdAt || ticket.created_at);
			if (isNaN(createdAt.getTime()) || createdAt < today || createdAt >= new Date(today.getTime() + 24 * 60 * 60 * 1000)) continue;

			const hour = createdAt.getHours();
			const slotStart = hour - (hour % 2);
			const slotLabel = `${String(slotStart).padStart(2, '0')}:00 - ${String(slotStart + 2).padStart(2, '0')}:00`;
			slotCounts[slotLabel]++;
		}

		return slotCounts;
	}

	// Return daily counts for range
	const result: Record<string, number> = {};
	for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
		const currentDate = new Date(d);
		currentDate.setHours(0, 0, 0, 0);

		const nextDay = new Date(currentDate);
		nextDay.setDate(currentDate.getDate() + 1);
		nextDay.setHours(0, 0, 0, 0);

		const dateLabel = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

		let count = 0;
		for (const ticket of tickets) {
			const createdAt = new Date(ticket.createdAt || ticket.created_at);
			if (isNaN(createdAt.getTime()) || createdAt < currentDate || createdAt >= nextDay) continue;
			count++;
		}

		result[dateLabel] = count;
	}

	return result;
};


