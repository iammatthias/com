<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { PageData } from './$types';

	interface TagData {
		tags: string[];
		tagCounts: Record<string, number>;
		error?: string;
	}

	export let data: TagData;

	$: tags = data.tags || [];
	$: tagCounts = data.tagCounts || {};
</script>

<div class="page" in:fade>
	<section class="breadcrumbs">
		<a href="/">Home</a>
		<span>/</span>
		<a href="/content">Content</a>
		<span>/</span>
		<span>Tags</span>
	</section>

	<section class="hero">
		<div class="hero-content">
			<h1>Content Tags</h1>
			<p>Browse content by tags</p>
		</div>
	</section>

	<hr class="divider divider-dark" />

	<section class="content">
		{#if tags.length === 0}
			<div class="alert info" role="alert">
				<p>No tags found. Add tags to your content to see them here.</p>
			</div>
		{:else}
			<div class="tags-grid">
				{#each tags as tag}
					<a href={`/content/tag/${tag}`} class="tag">
						<span class="tag-name">{tag}</span>
						<span class="tag-count">{tagCounts[tag] || 0}</span>
					</a>
				{/each}
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

	.tags-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: var(--space-4);
		max-width: 800px;
		margin-inline: auto;
	}

	.tag {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-3) var(--space-4);
		background-color: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text);
		text-decoration: none;
		transition: all var(--transition-fast);
	}

	.tag:hover {
		background-color: var(--color-bg-hover);
		border-color: var(--color-primary);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.tag-name {
		font-weight: 500;
	}

	.tag-count {
		background-color: var(--color-bg);
		color: var(--color-text-secondary);
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-full);
		font-size: var(--text-sm);
	}

	.alert {
		padding: var(--space-4);
		border-radius: var(--radius-md);
		margin-block: var(--space-4);
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

		.tags-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
