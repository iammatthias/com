<script lang="ts">
	import type { ContentItem } from '$lib/types';
	import Button from '$lib/components/Button.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import { formatContentType, formatDate } from '$lib/utils/formatters';

	interface PageDataWithContent {
		contentTypes: string[];
		contentMap: Record<string, ContentItem[]>;
		configError?: string;
		error?: string;
		isDev?: boolean;
		lastUpdated?: string;
	}

	export let data: PageDataWithContent;
</script>

<div class="page">
	<section class="hero">
		<div class="hero-content">
			<h1>Hi, I am Matthias</h1>
			<p>
				I'm a photographer turned growth technologist. Over the years I've worked in travel,
				fintech, and ecommerce.
			</p>
			<p>
				These days I run day---break, a marketing consultancy focused on growth and lifecycle
				automation.
			</p>
			<div class="actions">
				<Button href="/bio" variant="primary">More about me</Button>
				<Button href="/bio/contact" variant="secondary">Get in touch</Button>
			</div>
		</div>
	</section>

	<hr class="divider divider-dark" />

	<section class="content">
		{#if data.configError}
			<Alert type="error" title="Configuration Error">
				{data.configError}
			</Alert>
		{:else if data.error}
			<Alert type="error" title="Error">
				{data.error}
			</Alert>
		{:else if data.contentTypes && data.contentTypes.length > 0}
			<div class="grid">
				{#each data.contentTypes as contentType}
					{#if data.contentMap[contentType] && data.contentMap[contentType].length > 0}
						<div class="content-section">
							<h2>{formatContentType(contentType)}</h2>
							<div class="entries">
								{#each data.contentMap[contentType] as item (item.slug)}
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
							<Button href={`/content/${contentType}`} variant="secondary">
								View all {formatContentType(contentType)}
							</Button>
						</div>
					{/if}
				{/each}
			</div>
		{:else}
			<p>No content available at this time.</p>
		{/if}
		{#if data.lastUpdated}
			<p class="last-updated">
				Content last updated: {new Date(data.lastUpdated).toLocaleString()}
			</p>
		{/if}
	</section>
</div>

<style>
	.page {
		width: 100%;
		max-width: var(--content-width);
		margin: 0 auto;
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
		margin-bottom: var(--space-4);
	}

	.actions {
		display: flex;
		gap: var(--space-4);
		margin-top: var(--space-8);
	}

	.content {
		margin-block: var(--space-12);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 24rem), 1fr));
		gap: var(--space-8);
	}

	.content-section {
		display: grid;
		gap: var(--space-4);
	}

	.content-section h2 {
		font-size: var(--text-2xl);
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: var(--space-2);
	}

	.entries {
		display: grid;
		gap: var(--space-2);
	}

	.entry {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		padding-block: var(--space-2);
		color: var(--color-text);
		text-decoration: none;
		border-bottom: 1px solid var(--color-border);
		transition: all var(--transition-fast);
	}

	.entry:hover {
		color: var(--color-primary);
		border-color: var(--color-primary);
	}

	.title {
		font-weight: 500;
		flex: 1;
		margin-right: var(--space-4);
	}

	.date {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		white-space: nowrap;
	}

	.draft {
		display: inline-block;
		padding-inline: var(--space-2);
		font-size: var(--text-xs);
		font-weight: 500;
		color: var(--color-warning-text);
		background-color: var(--color-warning-bg);
		border: 1px solid var(--color-warning-border);
		border-radius: var(--radius-sm);
		margin-left: var(--space-2);
	}

	.last-updated {
		font-size: var(--text-sm);
		color: var(--color-text-tertiary);
		margin-top: var(--space-8);
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

		.actions {
			flex-direction: column;
		}

		.content {
			margin-block: var(--space-8);
		}

		.title {
			margin-right: var(--space-2);
		}
	}
</style>
