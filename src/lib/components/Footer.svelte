<script lang="ts">
	export const publishedContentTypes: string[] = [];

	// Format content type for display (e.g., "blog-posts" -> "Blog Posts")
	function formatContentType(type: string): string {
		return type
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	// Get current year for footer
	const currentYear = new Date().getFullYear();

	// Get featured socials for the footer
	const featuredPlatforms = ['GitHub', 'LinkedIn', 'Warpcast'];

	// Group links for better organization
	const mainLinks = [
		{ href: '/', label: 'Home' },
		{ href: '/bio', label: 'Bio' },
		{ href: '/content/published', label: 'Content' },
		{ href: '/dev', label: 'Developer' }
	];
</script>

<footer>
	<div class="container">
		<nav class="footer-nav">
			<ul class="footer-links">
				{#each mainLinks as link}
					<li>
						<a href={link.href} class="footer-link">{link.label}</a>
					</li>
				{/each}
			</ul>
		</nav>
		<div class="footer-bottom">
			<p class="copyright">&copy; {currentYear} Your Name. All rights reserved.</p>
			<a href="/dev" class="dev-link">Developer</a>
		</div>
	</div>
</footer>

<style>
	footer {
		margin-top: auto;
		padding: var(--space-4) 0;
		background-color: var(--color-bg);
		border-top: 1px solid var(--color-border);
	}

	.container {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		max-width: var(--content-width);
		margin: 0 auto;
		padding: 0 var(--space-4);
	}

	.footer-nav {
		display: flex;
		justify-content: center;
	}

	.footer-links {
		display: flex;
		gap: var(--space-6);
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.footer-link {
		color: var(--color-text-tertiary);
		text-decoration: none;
		font-size: var(--text-sm);
		transition: color var(--transition-fast);
	}

	.footer-link:hover {
		color: var(--color-text-primary);
	}

	.footer-bottom {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: var(--space-4);
		border-top: 1px solid var(--color-border);
	}

	.copyright {
		color: var(--color-text-tertiary);
		font-size: var(--text-sm);
		margin: 0;
	}

	.dev-link {
		color: var(--color-text-tertiary);
		text-decoration: none;
		border: none;
		font-size: var(--text-sm);
		transition: color var(--transition-fast);
	}

	.dev-link:hover {
		color: var(--color-text-primary);
	}

	@media (max-width: 768px) {
		.footer-links {
			flex-direction: column;
			align-items: center;
			gap: var(--space-3);
		}

		.footer-bottom {
			flex-direction: column;
			gap: var(--space-2);
			text-align: center;
		}
	}
</style>
