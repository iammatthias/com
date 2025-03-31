<script lang="ts">
	import ContentGrid from '$lib/components/ContentGrid.svelte';
	import type { ContentItem } from '$lib/types/content';
	import { formatContentType } from '$lib/utils/formatters';
	import type { PageData } from './$types';

	export let data: PageData;

	$: taggedItems = data.items || [];
	$: contentType = data.contentType || '';
	$: tag = data.tag || '';
</script>

<div class="page">
	<section class="header">
		<nav class="breadcrumbs">
			<a href="/">Home</a>
			<span>/</span>
			<a href="/content">Content</a>
			<span>/</span>
			<a href={`/content/${contentType}`}>{formatContentType(contentType)}</a>
			<span>/</span>
			<span>Tag: {tag}</span>
		</nav>

		<h1>Posts tagged with <span class="highlight">{tag}</span></h1>
		<p>Found {taggedItems.length} items with this tag</p>
	</section>

	<section class="content">
		<ContentGrid items={taggedItems} {contentType} isDev={data.isDev} />
	</section>
</div>

<style>
	.page {
		width: 100%;
		max-width: var(--max-width);
		margin: 0 auto;
	}

	.header {
		margin-block: var(--space-8);
		text-align: center;
	}

	.breadcrumbs {
		display: flex;
		gap: var(--space-2);
		margin-bottom: var(--space-6);
		font-size: var(--text-sm);
		color: var(--color-text-tertiary);
		justify-content: center;
	}

	.breadcrumbs a {
		color: var(--color-text-secondary);
		text-decoration: none;
		transition: color var(--transition-fast);
	}

	.breadcrumbs a:hover {
		color: var(--color-accent);
	}

	h1 {
		font-size: var(--text-4xl);
		letter-spacing: -0.02em;
		margin-bottom: var(--space-2);
	}

	.highlight {
		color: var(--color-accent);
		font-weight: 600;
	}

	p {
		color: var(--color-text-secondary);
		font-size: var(--text-lg);
	}

	.content {
		margin-block: var(--space-8);
	}

	@media (max-width: 768px) {
		.header {
			margin-block: var(--space-6);
		}

		h1 {
			font-size: var(--text-3xl);
		}

		p {
			font-size: var(--text-base);
		}
	}
</style>
