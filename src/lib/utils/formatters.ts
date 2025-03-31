/**
 * General purpose formatting utilities
 */

/**
 * Format content type for display (e.g. "blog-posts" -> "Blog Posts")
 */
export function formatContentType(type: string): string {
	if (!type) return '';

	return type
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

/**
 * Format a date string for display (e.g., January 1, 2024)
 */
export function formatDate(dateString: string): string {
	if (!dateString) return '';

	try {
		const date = new Date(dateString);

		// Check if date is valid
		if (isNaN(date.getTime())) {
			return ''; // Return empty string for invalid dates
		}

		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}).format(date);
	} catch (error) {
		console.error('Error formatting date:', error);
		return ''; // Return empty string on error
	}
}

/**
 * Format date for list view (e.g., Jan 1 or Jan 1, 2023)
 */
export function formatListDate(dateString: string): string {
	if (!dateString) return '';
	try {
		const date = new Date(dateString);
		// Check if date is valid
		if (isNaN(date.getTime())) {
			return '';
		}

		const now = new Date();
		const isCurrentYear = date.getFullYear() === now.getFullYear();

		// If current year, don't show the year
		if (isCurrentYear) {
			return date.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric'
			});
		}

		// Otherwise, include the year
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	} catch (error) {
		console.error('Error formatting list date:', error);
		return '';
	}
}
