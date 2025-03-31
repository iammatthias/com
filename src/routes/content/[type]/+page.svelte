<script lang="ts">
	import { fade } from 'svelte/transition';
	import ContentGrid from '$lib/components/ContentGrid.svelte';
	import { formatContentType } from '$lib/utils/formatters';
	import type { PageData } from './$types';
	import type { ContentItem } from '$lib/types';
	import { dev } from '$app/environment';

	export let data: PageData;

	$: contentType = data.contentType || '';
	$: items = data.items || [];
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
			{:else}
				<p>
					Browse through {items.length}
					{items.length === 1 ? 'entry' : 'entries'} of {formatContentType(
						contentType
					).toLowerCase()}.
				</p>
			{/if}
		</div>
	</section>

	<hr class="divider divider-dark" />

	<section class="content">
		<ContentGrid {items} {contentType} isDev={dev} />
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
		max-width: 65ch;
		margin: 0 auto;
		text-align: center;
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
