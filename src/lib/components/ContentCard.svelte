<script lang="ts">
	import { goto } from '$app/navigation';

	export let item: {
		title: string;
		slug: string;
		date: string;
		excerpt?: string;
		metadata?: {
			updated?: string;
			published?: boolean;
			category?: string;
			tags?: string | string[];
		};
	};
	export let contentType: string;
	export let isDev: boolean = false;

	// Format date for list view (more compact)
	function formatListDate(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const isCurrentYear = date.getFullYear() === now.getFullYear();

		// If current year, don't show the year
		if (isCurrentYear) {
			return date.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric'
			});
		}

		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// Handle tag click
	function handleTagClick(tag: string) {
		goto(`/tag/${tag}`);
	}
</script>

<article class="card">
	<div class="card-content">
		<a href={`/content/${contentType}/${item.slug}`} class="card-link">
			<h2>
				{item.title}
				{#if isDev && item.metadata?.published === false}
					<span class="draft-badge">Draft</span>
				{/if}
			</h2>

			<div class="card-meta">
				<div class="date-info">
					<time datetime={item.date} class="date-label">
						Published: {formatListDate(item.date)}
					</time>
					{#if item.metadata?.updated && item.metadata.updated !== item.date}
						<time datetime={item.metadata.updated} class="date-label">
							Updated: {formatListDate(item.metadata.updated)}
						</time>
					{/if}
				</div>

				{#if item.metadata?.category}
					<span class="badge">{item.metadata.category}</span>
				{/if}
			</div>

			{#if item.excerpt}
				<p class="excerpt">{item.excerpt}</p>
			{/if}
		</a>

		{#if item.metadata?.tags?.length}
			<div class="card-tags">
				{#each Array.isArray(item.metadata.tags) ? item.metadata.tags : [item.metadata.tags] as tag}
					<button class="tag" on:click={() => handleTagClick(tag)}>
						{tag}
					</button>
				{/each}
			</div>
		{/if}

		<a href={`/content/${contentType}/${item.slug}`} class="read-more"> Read article → </a>
	</div>
</article>

<style>
	.card {
		background-color: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		transition: transform var(--transition-fast);
	}

	.card:hover {
		transform: translateY(-2px);
	}

	.card-content {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: var(--space-2);
	}

	.card-link {
		color: inherit;
		text-decoration: none;
		border-bottom: none;
		flex: 1;
	}

	.card h2 {
		font-size: var(--text-xl);
		font-weight: 500;
		letter-spacing: -0.01em;
		margin-top: 0;
		margin-bottom: var(--space-3);
	}

	.card-meta {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		font-size: var(--text-sm);
		color: var(--color-text-tertiary);
		margin-bottom: var(--space-3);
	}

	.date-info {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.date-label {
		display: block;
		white-space: nowrap;
	}

	.card-tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
	}

	.tag {
		font-size: var(--text-xs);
		color: var(--color-text-secondary);
		background-color: var(--color-bg-tertiary);
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-full);
		border: none;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.tag:hover {
		color: white;
		background-color: var(--color-accent);
	}

	.excerpt {
		color: var(--color-text-secondary);
		font-size: var(--text-sm);
		line-height: 1.6;
		margin-bottom: var(--space-4);
	}

	.read-more {
		color: var(--color-accent);
		font-size: var(--text-sm);
		font-weight: 500;
		text-decoration: none;
		border-bottom: none;
		margin-top: auto;
		display: inline-block;
	}

	.read-more:hover {
		border-bottom: none;
	}
</style>
