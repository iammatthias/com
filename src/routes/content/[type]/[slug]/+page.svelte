<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
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

<div class="page" in:fade>
	{#if item}
		<article>
			<section class="breadcrumbs">
				<a href="/">Home</a>
				<span>/</span>
				<a href="/content">Content</a>
				<span>/</span>
				<a href={`/content/${contentType}`}>{formatContentType(contentType)}</a>
				<span>/</span>
				<span>{item.title}</span>
			</section>

			<section class="hero">
				<div class="hero-content">
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
				</div>
			</section>

			<hr class="divider divider-dark" />

			<section class="content">
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

	.content {
		margin-block: var(--space-12);
	}

	.meta {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		margin-top: var(--space-4);
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
		transition: color var(--transition-fast);
	}

	.type:hover {
		color: var(--color-text);
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		justify-content: center;
		margin-bottom: var(--space-4);
	}

	.tag {
		padding: var(--space-1) var(--space-3);
		background-color: var(--color-bg-secondary);
		border-radius: var(--radius-full);
		color: var(--color-text-secondary);
		text-decoration: none;
		font-size: var(--text-sm);
		transition: all var(--transition-fast);
	}

	.tag:hover {
		background-color: var(--color-bg-hover);
		color: var(--color-text);
	}

	.image {
		margin-bottom: var(--space-8);
	}

	.image img {
		width: 100%;
		height: auto;
		border-radius: var(--radius-lg);
	}

	.image figcaption {
		text-align: center;
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		margin-top: var(--space-2);
	}

	.body {
		max-width: 65ch;
		margin: 0 auto;
	}

	footer {
		margin-top: var(--space-12);
		padding-top: var(--space-8);
		border-top: 1px solid var(--color-border);
	}

	.back {
		display: inline-block;
		color: var(--color-text-secondary);
		text-decoration: none;
		transition: color var(--transition-fast);
	}

	.back:hover {
		color: var(--color-text);
	}

	.footer-tags {
		margin-top: var(--space-8);
	}

	.footer-tags h3 {
		font-size: var(--text-lg);
		font-weight: 600;
		margin-bottom: var(--space-4);
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-4);
		min-height: 50vh;
	}

	.spinner {
		display: inline-block;
		position: relative;
		width: 80px;
		height: 80px;
	}

	.spinner div {
		box-sizing: border-box;
		display: block;
		position: absolute;
		width: 64px;
		height: 64px;
		margin: 8px;
		border: 8px solid var(--color-text);
		border-radius: 50%;
		animation: spinner 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
		border-color: var(--color-text) transparent transparent transparent;
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
		.hero {
			margin-block: var(--space-8);
		}

		.hero h1 {
			font-size: var(--text-3xl);
		}

		.content {
			margin-block: var(--space-8);
		}

		.meta {
			flex-direction: column;
			gap: var(--space-4);
			align-items: center;
		}

		.info {
			flex-direction: column;
			gap: var(--space-2);
		}
	}
</style>
