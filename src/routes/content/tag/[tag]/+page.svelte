<script lang="ts">
	import ContentGrid from '$lib/components/ContentGrid.svelte';
	import type { PageData } from './$types';
	import { formatContentType } from '$lib/utils/formatters';
	import type { ContentItem } from '$lib/types/content';

	/** @type {import('./$types').PageData} */
	export let data;

	$: taggedItems = data.items as ContentItem[];
</script>

<div class="page">
	<section class="header">
		<nav class="breadcrumbs">
			<a href="/">Home</a>
			<span>/</span>
			<a href="/content">Content</a>
			<span>/</span>
			<a href={`/content/${data.contentType}`}>{formatContentType(data.contentType)}</a>
			<span>/</span>
			<span>Tag: {data.tag}</span>
		</nav>

		<h1>Posts tagged with <span class="highlight">{data.tag}</span></h1>
		<p>Found {data.items.length} items with this tag</p>
	</section>

	<section class="content">
		<ContentGrid items={taggedItems} contentType={data.contentType} isDev={data.isDev} />
	</section>
</div>

<style>
	section {
		width: 100%;
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
