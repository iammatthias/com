import type { PageServerLoad } from './$types';
import { getNavigationItems } from '$lib/utils/navigation';

export const load: PageServerLoad = async ({ url }) => {
	const sections = await getNavigationItems();

	return {
		sections,
		currentPath: url.pathname
	};
};
