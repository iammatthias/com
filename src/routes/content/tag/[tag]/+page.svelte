<script lang="ts">
	import { fade } from 'svelte/transition';
	import ContentGrid from '$lib/components/ContentGrid.svelte';
	import type { PageData } from './$types';
	import { formatContentType } from '$lib/utils/formatters';
	import type { ContentItem } from '$lib/types';

	export let data: PageData;

	$: taggedItems = data.items as ContentItem[];
</script>

<div class="page" in:fade>
	<section class="breadcrumbs">
		<a href="/">Home</a>
		<span>/</span>
		<a href="/content">Content</a>
		<span>/</span>
		<a href="/content/tag">Tags</a>
		<span>/</span>
		<span>{data.tag}</span>
	</section>

	<section class="hero">
		<div class="hero-content">
			<h1>Tagged with <span class="highlight">{data.tag}</span></h1>
			<p>Found {data.items.length} items with this tag</p>
		</div>
	</section>

	<hr class="divider divider-dark" />

	<section class="content">
		<ContentGrid items={taggedItems} contentType={data.contentType} isDev={data.isDev} />
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

	.highlight {
		color: var(--color-primary);
	}

	.content {
		margin-block: var(--space-12);
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
	}
</style>
