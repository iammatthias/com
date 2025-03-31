<script lang="ts">
	import ContentGrid from '$lib/components/ContentGrid.svelte';
	import { formatContentType } from '$lib/utils/formatters';
	import type { PageData } from './$types';
	import type { ContentItem } from '$lib/types';
	import { dev } from '$app/environment';

	export let data: PageData;

	$: contentType = data.contentType || '';
	$: items = data.items || [];
</script>

<div class="page">
	<section class="breadcrumbs">
		<a href="/">Home</a>
		<span>/</span>
		<a href="/content">Content</a>
		<span>/</span>
		<span>{formatContentType(contentType)}</span>
	</section>

	<section class="header">
		<h1>{formatContentType(contentType)}</h1>
		{#if items.length === 0}
			<p>No published content available.</p>
		{:else}
			<p>Browse through {items.length} {items.length === 1 ? 'entry' : 'entries'}</p>
		{/if}
	</section>

	<section class="content">
		<ContentGrid {items} {contentType} isDev={dev} />
	</section>
</div>

<style>
	.page {
		max-width: var(--content-width);
		margin: 0 auto;
		padding: var(--space-8) var(--space-4);
	}

	.breadcrumbs {
		margin-bottom: var(--space-8);
		color: var(--color-text-secondary);
	}

	.breadcrumbs a {
		color: var(--color-text-secondary);
		text-decoration: none;
	}

	.breadcrumbs a:hover {
		color: var(--color-text);
	}

	.breadcrumbs span {
		margin: 0 var(--space-2);
	}

	.header {
		margin-bottom: var(--space-8);
		text-align: center;
	}

	.header h1 {
		font-size: var(--text-4xl);
		font-weight: 700;
		margin-bottom: var(--space-4);
	}

	.header p {
		color: var(--color-text-secondary);
		font-size: var(--text-lg);
	}

	.content {
		margin-top: var(--space-8);
	}
</style>
