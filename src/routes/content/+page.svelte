<script lang="ts">
	import { fade } from 'svelte/transition';
	import Pagination from '$lib/components/Pagination.svelte';

	interface ContentItem {
		slug: string;
		title: string;
		date: string;
		metadata?: {
			published?: boolean;
			[key: string]: any;
		};
	}

	interface PageDataWithContent {
		contentTypes: string[];
		contentMap: Record<string, ContentItem[]>;
		configError?: string;
		error?: string;
		isDev?: boolean;
		pagination: {
			currentPage: number;
			totalPages: number;
			totalItems: number;
			itemsPerPage: number;
		};
	}

	export let data: PageDataWithContent;

	// Format content type for display (e.g., "blog-posts" -> "Blog Posts")
	function formatContentType(type: string): string {
		return type
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	// Format date for display
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<div class="page" in:fade>
	<section class="breadcrumbs">
		<a href="/">Home</a>
		<span>/</span>
		<span>Content</span>
	</section>

	<section class="hero">
		<div class="hero-content">
			<h1>All Content</h1>
			<p>Browse through all content categories</p>
		</div>
	</section>

	<hr class="divider divider-dark" />

	<section class="content">
		{#if data.configError}
			<div class="alert error" role="alert">
				<p>{data.configError}</p>
			</div>
		{:else if data.error}
			<div class="alert error" role="alert">
				<p>{data.error}</p>
			</div>
		{:else if data.contentTypes && data.contentTypes.length > 0}
			<div class="categories">
				{#each data.contentTypes as contentType}
					{#if data.contentMap[contentType] && data.contentMap[contentType].length > 0}
						<div class="category">
							<h2>{formatContentType(contentType)}</h2>
							<div class="entries">
								{#each data.contentMap[contentType] as item}
									<a href={`/content/${contentType}/${item.slug}`} class="entry">
										<span class="title">
											{item.title}
											{#if data.isDev && item.metadata?.published === false}
												<span class="draft">Draft</span>
											{/if}
										</span>
										<span class="date">{formatDate(item.date)}</span>
									</a>
								{/each}
							</div>
							<a href={`/content/${contentType}`} class="view-all">
								View all {formatContentType(contentType)}
							</a>
						</div>
					{/if}
				{/each}
			</div>

			<Pagination
				totalItems={data.pagination.totalItems}
				itemsPerPage={data.pagination.itemsPerPage}
				currentPage={data.pagination.currentPage}
				baseUrl="/content"
			/>
		{:else}
			<div class="alert info" role="alert">
				<p>
					No content collections are currently available. Make sure your GitHub repository is
					properly configured.
				</p>
			</div>
		{/if}
	</section>
</div>

<style>
	.page {
		width: 100%;
		max-width: var(--content-width);
		margin: 0 auto;
	}

	.breadcrumbs {
		margin-block: var(--space-8);
		color: var(--color-text-secondary);
	}

	.breadcrumbs a {
		color: var(--color-text-secondary);
		text-decoration: none;
		transition: color var(--transition-fast);
	}

	.breadcrumbs a:hover {
		color: var(--color-text);
	}

	.breadcrumbs span {
		margin: 0 var(--space-2);
	}

	.hero {
		margin-block: var(--space-12);
	}

	.hero-content {
		max-width: var(--content-width);
		margin: 0 auto;
	}

	.hero h1 {
		font-size: var(--text-4xl);
		font-weight: 700;
		letter-spacing: -0.02em;
		margin-bottom: var(--space-4);
		color: var(--color-text);
	}

	.hero p {
		font-size: var(--text-lg);
		line-height: 1.5;
		color: var(--color-text-secondary);
	}

	.content {
		margin-block: var(--space-12);
	}

	.categories {
		display: grid;
		gap: var(--space-8);
	}

	.category {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.category h2 {
		font-size: var(--text-2xl);
		font-weight: 600;
		margin: 0;
		padding-bottom: var(--space-2);
		border-bottom: 1px solid var(--color-border);
	}

	.entries {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.entry {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		padding: var(--space-2) var(--space-3);
		text-decoration: none;
		color: var(--color-text-primary);
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
	}

	.entry:hover {
		background-color: var(--color-bg-secondary);
	}

	.title {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.draft {
		font-size: var(--text-sm);
		color: var(--color-text-tertiary);
		padding: 0.1em 0.4em;
		border-radius: var(--radius-sm);
		background-color: var(--color-bg-tertiary);
	}

	.date {
		font-size: var(--text-sm);
		color: var(--color-text-tertiary);
	}

	.view-all {
		display: inline-flex;
		align-items: center;
		padding: var(--space-2) var(--space-4);
		color: var(--color-text-secondary);
		text-decoration: none;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
		align-self: flex-start;
	}

	.view-all:hover {
		color: var(--color-text-primary);
		background-color: var(--color-bg-secondary);
		border-color: var(--color-text-secondary);
	}

	.alert {
		padding: var(--space-4);
		border-radius: var(--radius-md);
		margin-block: var(--space-4);
	}

	.alert.error {
		background-color: var(--color-error-bg);
		color: var(--color-error-text);
		border: 1px solid var(--color-error-border);
	}

	.alert.info {
		background-color: var(--color-info-bg);
		color: var(--color-info-text);
		border: 1px solid var(--color-info-border);
	}

	@media (max-width: 768px) {
		.hero {
			margin-block: var(--space-8);
		}

		.hero h1 {
			font-size: var(--text-3xl);
		}

		.hero p {
			font-size: var(--text-base);
		}

		.content {
			margin-block: var(--space-8);
		}

		.categories {
			gap: var(--space-8);
		}

		.entry {
			flex-direction: column;
			gap: var(--space-1);
		}

		.date {
			font-size: var(--text-xs);
		}
	}
</style>
