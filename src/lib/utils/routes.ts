import { dev } from '$app/environment';
import { getContentFolders } from '$lib/services/content';

// Routes that should never show in navigation
const BLACKLISTED_ROUTES = new Set(['api', 'dev', '_', '[contentType]', 'tag']);

// Routes that should only show in dev mode
const DEV_ONLY_ROUTES = new Set(['drafts']);

export interface RouteNode {
	path: string;
	label: string;
	children?: RouteNode[];
}

function formatRouteLabel(path: string): string {
	return path
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

function isValidRoute(path: string): boolean {
	// Skip blacklisted routes
	if (BLACKLISTED_ROUTES.has(path)) return false;

	// Skip dev routes in production
	if (!dev && DEV_ONLY_ROUTES.has(path)) return false;

	// Skip routes starting with underscore or bracket
	if (path.startsWith('_') || path.startsWith('[')) return false;

	return true;
}

export async function discoverRoutes(): Promise<RouteNode[]> {
	const routes: RouteNode[] = [];

	// Always add Home route first
	routes.push({
		path: '/',
		label: 'Home'
	});

	// Add Bio route
	routes.push({
		path: '/bio',
		label: 'Bio'
	});

	// Add Content route with dynamic children
	const contentNode: RouteNode = {
		path: '/content',
		label: 'Content',
		children: []
	};

	try {
		// Get content types from the content service
		const contentTypes = await getContentFolders();

		// Add each valid content type as a child route
		for (const contentType of contentTypes) {
			if (isValidRoute(contentType)) {
				contentNode.children?.push({
					path: `/content/${contentType}`,
					label: formatRouteLabel(contentType)
				});
			}
		}

		// Only add content node if it has children
		if (contentNode.children && contentNode.children.length > 0) {
			routes.push(contentNode);
		}
	} catch (error) {
		console.error('Error discovering content routes:', error);
	}

	return routes;
}
