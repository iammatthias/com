declare module 'mdsvex' {
	/**
	 * Compile markdown content with MDsveX
	 */
	export function compile(
		content: string,
		options?: Record<string, unknown>
	): Promise<{
		code: string;
		data?: Record<string, unknown>;
		map?: Record<string, unknown>;
	}>;
}
