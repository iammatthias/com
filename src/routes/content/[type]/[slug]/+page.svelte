<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { toastStore } from '$lib/store/toast';
	import { formatContentType } from '$lib/utils/formatters';
	import type { PageData } from './$types';

	export let data: PageData;

	$: contentType = data.contentType || '';
	$: item = data.item;

	onMount(() => {
		if (browser && item?.content) {
			// Select all headings in the content
			const headings = document.querySelectorAll(
				'.content h2, .content h3, .content h4, .content h5, .content h6'
			);

			headings.forEach((heading) => {
				const text = heading.textContent || '';
				const id = text
					.toLowerCase()
					.replace(/\s+/g, '-')
					.replace(/[^\w-]/g, '');

				// Set ID on the heading
				heading.id = id;

				// Make heading clickable
				heading.addEventListener('click', () => {
					// Update URL with hash
					window.history.pushState(null, '', `#${id}`);

					// Copy to clipboard functionality
					navigator.clipboard
						.writeText(window.location.href)
						.then(() => {
							toastStore.success('Link copied to clipboard', 2000);
						})
						.catch((err) => {
							console.error('Failed to copy link:', err);
							toastStore.error('Failed to copy link');
						});
				});
			});

			// Scroll to hash on load
			if (window.location.hash) {
				const targetId = window.location.hash.substring(1);
				const targetElement = document.getElementById(targetId);
				if (targetElement) {
					setTimeout(() => {
						targetElement.scrollIntoView({ behavior: 'smooth' });
					}, 100);
				}
			}
		}
	});
</script>

<div class="page">
	{#if item}
		<article>
			<section class="content">
				<nav class="breadcrumbs">
					<a href="/">Home</a>
					<span>/</span>
					<a href="/content">Content</a>
					<span>/</span>
					<a href={`/content/${contentType}`}>{formatContentType(contentType)}</a>
					<span>/</span>
					<span>{item.title}</span>
				</nav>

				<header>
					{#if item.metadata?.tags}
						<div class="tags">
							{#each Array.isArray(item.metadata.tags) ? item.metadata.tags : [item.metadata.tags] as tag}
								<a href={`/content/tag/${tag}`} class="tag">{tag}</a>
							{/each}
						</div>
					{/if}

					<h1>{item.title}</h1>

					<div class="meta">
						<div class="dates">
							<time datetime={item.date}>
								{new Date(item.date).toLocaleDateString('en-US', {
									year: 'numeric',
									month: 'long',
									day: 'numeric'
								})}
							</time>
							{#if item.metadata?.updated && item.metadata.updated !== item.date}
								<div class="updated">
									<span>⟳</span>
									<time datetime={item.metadata.updated}>
										Updated: {new Date(item.metadata.updated).toLocaleDateString('en-US', {
											year: 'numeric',
											month: 'long',
											day: 'numeric'
										})}
									</time>
								</div>
							{/if}
						</div>

						<div class="info">
							{#if item.metadata?.category}
								<span class="badge">{item.metadata.category}</span>
							{/if}
							<a href={`/content/${contentType}`} class="type">
								{formatContentType(contentType)}
							</a>
						</div>
					</div>
				</header>

				{#if item.metadata?.image}
					<figure class="image">
						<img src={item.metadata.image} alt={item.title} loading="lazy" />
						{#if item.metadata?.imageCredit}
							<figcaption>{item.metadata.imageCredit}</figcaption>
						{/if}
					</figure>
				{/if}

				<div class="body">
					{#if item.processedContent}
						{@html item.processedContent}
					{:else if item.content}
						<div class="alert warning" role="alert">
							Content could not be processed. Displaying raw content:
						</div>
						<pre>{item.content}</pre>
					{:else}
						<div class="alert error" role="alert">Content is missing or empty</div>
					{/if}
				</div>

				<footer>
					<a href={`/content/${contentType}`} class="back">
						← View all {formatContentType(contentType).toLowerCase()}
					</a>

					{#if item.metadata?.tags}
						<div class="footer-tags">
							<h3>Tagged in</h3>
							<div class="tags">
								{#each Array.isArray(item.metadata.tags) ? item.metadata.tags : [item.metadata.tags] as tag}
									<a href={`/content/tag/${tag}`} class="tag">{tag}</a>
								{/each}
							</div>
						</div>
					{/if}
				</footer>
			</section>
		</article>
	{:else}
		<div class="loading">
			<div class="spinner">
				<div></div>
				<div></div>
				<div></div>
				<div></div>
			</div>
			<p>Loading content...</p>
		</div>
	{/if}
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

	header {
		margin-bottom: var(--space-8);
	}

	h1 {
		font-size: var(--text-4xl);
		font-weight: 700;
		margin-bottom: var(--space-4);
	}

	.meta {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
	}

	.dates {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.updated {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.info {
		display: flex;
		align-items: center;
		gap: var(--space-4);
	}

	.badge {
		padding: var(--space-1) var(--space-2);
		background-color: var(--color-bg-secondary);
		border-radius: var(--radius-full);
		font-size: var(--text-xs);
	}

	.type {
		color: var(--color-text-secondary);
		text-decoration: none;
	}

	.type:hover {
		color: var(--color-text);
	}

	.tags {
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
		text-decoration: none;
		transition: all var(--transition-fast);
	}

	.tag:hover {
		color: white;
		background-color: var(--color-accent);
	}

	.image {
		margin: var(--space-8) 0;
	}

	.image img {
		width: 100%;
		height: auto;
		border-radius: var(--radius-lg);
	}

	.image figcaption {
		margin-top: var(--space-2);
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		text-align: center;
	}

	.body {
		margin-bottom: var(--space-8);
	}

	footer {
		margin-top: var(--space-8);
		padding-top: var(--space-6);
		border-top: 1px solid var(--color-border);
	}

	.back {
		color: var(--color-text-secondary);
		text-decoration: none;
	}

	.back:hover {
		color: var(--color-text);
	}

	.footer-tags {
		margin-top: var(--space-6);
	}

	.footer-tags h3 {
		font-size: var(--text-lg);
		margin-bottom: var(--space-3);
	}

	.alert {
		padding: var(--space-4);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-6);
	}

	.alert.warning {
		background-color: var(--color-warning-bg);
		color: var(--color-warning-text);
		border: 1px solid var(--color-warning-border);
	}

	.alert.error {
		background-color: var(--color-error-bg);
		color: var(--color-error-text);
		border: 1px solid var(--color-error-border);
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-8);
		color: var(--color-text-secondary);
	}

	.spinner {
		display: inline-block;
		position: relative;
		width: 40px;
		height: 40px;
	}

	.spinner div {
		box-sizing: border-box;
		display: block;
		position: absolute;
		width: 32px;
		height: 32px;
		margin: 4px;
		border: 4px solid var(--color-text-secondary);
		border-radius: 50%;
		animation: spinner 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
		border-color: var(--color-text-secondary) transparent transparent transparent;
	}

	.spinner div:nth-child(1) {
		animation-delay: -0.45s;
	}

	.spinner div:nth-child(2) {
		animation-delay: -0.3s;
	}

	.spinner div:nth-child(3) {
		animation-delay: -0.15s;
	}

	@keyframes spinner {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 768px) {
		.meta {
			flex-direction: column;
			gap: var(--space-4);
		}

		.info {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
