export interface NavItem {
	href: string;
	label: string;
	description: string;
	icon?: string;
}

export interface NavSection {
	items: NavItem[];
	active?: boolean;
}
