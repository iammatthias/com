import type { NavItem, NavSection } from '$lib/types/nav';
import { dev } from '$app/environment';

export interface RouteInfo {
	path: string;
	metadata?: {
		title?: string;
		description?: string;
		published?: boolean;
	};
}

export async function getNavigationItems(): Promise<NavSection[]> {
	const sections: NavSection[] = [];

	// Bio section
	const bioItems: NavItem[] = [
		{
			href: '/bio',
			label: 'Bio',
			description: 'About me and contact information',
			icon: 'user'
		}
	];

	sections.push({
		items: bioItems
	});

	// Content section (dynamic from GitHub)
	const contentItems = await getContentItems();
	if (contentItems.length > 0) {
		sections.push({
			items: contentItems
		});
	}

	// Developer section
	const devItems: NavItem[] = [
		{
			href: '/dev',
			label: 'Developer',
			description: 'Development tools and documentation',
			icon: 'code'
		}
	];

	sections.push({
		items: devItems
	});

	return sections;
}

async function getContentItems(): Promise<NavItem[]> {
	const items: NavItem[] = [];

	try {
		// In development mode, show all content
		if (dev) {
			items.push({
				href: '/content/drafts',
				label: 'Drafts',
				description: 'Work in progress content',
				icon: 'draft'
			});
		}

		// Add published content sections
		items.push({
			href: '/content/published',
			label: 'Published',
			description: 'Public content and articles',
			icon: 'article'
		});
	} catch (error) {
		console.error('Error fetching content items:', error);
	}

	return items;
}

export function isValidRoute(path: string): boolean {
	// Add validation logic here
	// This should check if the route actually exists in the app
	return true; // Placeholder
}
