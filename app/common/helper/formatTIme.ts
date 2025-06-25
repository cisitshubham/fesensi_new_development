import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export const formatTime = (value: any): string => {
	const date = dayjs(value);
	const now = dayjs();

	if (!date.isValid()) return 'Invalid Date';

	const diffInMinutes = now.diff(date, 'minute');
	const diffInHours = now.diff(date, 'hour');

	if (diffInMinutes < 1) {
		return 'Just now';
	}

	if (diffInMinutes < 60) {
		return `${diffInMinutes}m ago`;
	}

	if (diffInHours < 24) {
		return `${diffInHours}h ago`;
	}

	if (diffInHours >= 24 && diffInHours < 48) {
		return 'Yesterday';
	}

	if (diffInHours >= 48 && diffInHours < 168) {
		// Within the past week
		return date.format('dddd, HH:mm'); // e.g., "Monday, 14:22"
	}

	// Older than a week
	return date.format('MMM D, YYYY');
};

