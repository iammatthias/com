<script lang="ts">
	import { fade } from 'svelte/transition';
	import ContentGrid from '$lib/components/ContentGrid.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import { formatContentType } from '$lib/utils/formatters';
	import type { PageData } from './$types';
	import type { ContentItem } from '$lib/types';
	import { dev } from '$app/environment';

	export let data: PageData;

	$: contentType = data.contentType || '';
	$: items = data.items || [];
	$: pagination = data.pagination;
	$: metadata = data.metadata;

	let showMetadata = false;
</script>

<div class="page" in:fade>
	<section class="breadcrumbs">
		<a href="/">Home</a>
		<span>/</span>
		<a href="/content">Content</a>
		<span>/</span>
		<span>{formatContentType(contentType)}</span>
	</section>

	<section class="hero">
		<div class="hero-content">
			<h1>{formatContentType(contentType)}</h1>
			{#if items.length === 0}
				<p>No published content available.</p>
			{/if}
			<div class="hero-meta">
				<div class="meta-grid">
					<div class="meta-item">
						<strong>{metadata.totalEntries}</strong>
						{metadata.totalEntries === 1 ? 'entry' : 'entries'}
						{#if metadata.draftCount > 0}
							<span class="draft-count">+{metadata.draftCount} drafts</span>
						{/if}
					</div>

					<div class="meta-item">
						<span>Published:</span>
						<time datetime={metadata.lastPublished}>
							{new Date(metadata.lastPublished).toLocaleDateString('en-US', {
								year: 'numeric',
								month: 'long',
								day: 'numeric'
							})}
						</time>
					</div>

					<div class="meta-item">
						<span>Updated:</span>
						<time datetime={metadata.lastUpdated}>
							{new Date(metadata.lastUpdated).toLocaleDateString('en-US', {
								year: 'numeric',
								month: 'long',
								day: 'numeric'
							})}
						</time>
					</div>

					{#if metadata.categories.length > 0 || metadata.tags.length > 0}
						<div class="meta-item taxonomy">
							<button
								class="taxonomy-toggle"
								on:click={() => (showMetadata = !showMetadata)}
								aria-expanded={showMetadata}
							>
								<span class="taxonomy-summary">
									{#if metadata.categories.length > 0}
										{metadata.categories.length}
										{metadata.categories.length === 1 ? 'category' : 'categories'}
									{/if}
									{#if metadata.categories.length > 0 && metadata.tags.length > 0}&nbsp;&&nbsp;{/if}
									{#if metadata.tags.length > 0}
										{metadata.tags.length} {metadata.tags.length === 1 ? 'tag' : 'tags'}
									{/if}
								</span>
								<span class="toggle-icon">{showMetadata ? '−' : '+'}</span>
							</button>

							{#if showMetadata}
								<div class="taxonomy-details" transition:fade={{ duration: 150 }}>
									{#if metadata.categories.length > 0}
										<div class="categories">
											{#each metadata.categories as category}
												<span class="category">{category}</span>
											{/each}
										</div>
									{/if}
									{#if metadata.tags.length > 0}
										<div class="tags">
											{#each metadata.tags as tag}
												<a href={`/content/tag/${tag}`} class="tag">{tag}</a>
											{/each}
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</section>

	<hr class="divider divider-dark" />

	<section class="content">
		{#if data.error}
			<div class="alert error" role="alert">
				<p>{data.error}</p>
			</div>
		{:else if items.length > 0}
			<ContentGrid {items} {contentType} isDev={dev} />
			<Pagination
				totalItems={pagination.totalItems}
				itemsPerPage={pagination.itemsPerPage}
				currentPage={pagination.currentPage}
			/>
		{:else}
			<div class="alert info" role="alert">
				<p>No published content available in this category.</p>
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

	.hero-meta {
		margin-top: var(--space-6);
	}

	.meta-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-4);
		align-items: start;
		position: relative;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--color-text-secondary);
		flex-wrap: wrap;
	}

	.meta-item strong {
		color: var(--color-text-primary);
	}

	.draft-count {
		font-size: var(--text-sm);
		color: var(--color-text-tertiary);
	}

	.taxonomy {
		grid-column: 1 / -1;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-2);
		margin-top: var(--space-2);
	}

	.taxonomy-toggle {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		background: none;
		border: 1px solid var(--color-border);
		padding: var(--space-2) var(--space-3);
		color: var(--color-text-secondary);
		cursor: pointer;
		font-size: var(--text-sm);
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.taxonomy-toggle:hover {
		background-color: var(--color-bg-secondary);
		color: var(--color-text-primary);
		border-color: var(--color-text-secondary);
	}

	.toggle-icon {
		font-size: var(--text-base);
		line-height: 1;
		color: var(--color-text-tertiary);
	}

	.taxonomy-details {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-4);
		background-color: var(--color-bg-secondary);
		border-radius: var(--radius-md);
		width: 100%;
		border: 1px solid var(--color-border);
	}

	.categories,
	.tags {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.categories {
		padding-bottom: var(--space-3);
		border-bottom: 1px solid var(--color-border);
	}

	.category {
		padding: var(--space-1) var(--space-2);
		background-color: var(--color-bg-secondary);
		border-radius: var(--radius-sm);
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
	}

	.tag {
		padding: var(--space-1) var(--space-2);
		background-color: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		text-decoration: none;
		transition: all var(--transition-fast);
	}

	.tag:hover {
		background-color: var(--color-bg-tertiary);
		border-color: var(--color-text-secondary);
		color: var(--color-text-primary);
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
		.hero-meta {
			gap: var(--space-4);
		}

		.meta-grid {
			grid-template-columns: 1fr;
			gap: var(--space-3);
		}

		.meta-item {
			flex-direction: row;
			align-items: center;
			gap: var(--space-2);
		}
	}
</style>
