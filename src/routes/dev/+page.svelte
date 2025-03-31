<script lang="ts">
	import { fade } from 'svelte/transition';
	import GitHubStatus from '$lib/components/dev/GitHubStatus.svelte';
	import { dev } from '$app/environment';
	import { formatContentType } from '$lib/utils/formatters';
	import type { PageData } from './$types';

	export let data: PageData;
	$: contentTypes = data.contentTypes || [];
</script>

<div class="page" in:fade>
	<section class="breadcrumbs">
		<a href="/">Home</a>
		<span>/</span>
		<span>Developer Dashboard</span>
	</section>

	<section class="header">
		<h1>Developer Dashboard</h1>
		<p>
			This page provides tools to test and monitor the site's integration with external services.
		</p>
	</section>

	<section class="content">
		<div class="github-section">
			<h2>GitHub Integration</h2>
			<p>This site uses a private GitHub repository as a CMS for markdown content.</p>

			{#if dev}
				<GitHubStatus />
			{:else}
				<div class="alert alert-warning">
					<p>GitHub status monitoring is only available in development mode.</p>
				</div>
			{/if}

			<div class="quick-links">
				<h3>Quick Links</h3>
				<div class="links-grid">
					<div class="links-section">
						<h4>Development</h4>
						{#if dev}
							<ul>
								<li><a href="/api/github-test" target="_blank">Test GitHub API</a></li>
								<li><a href="/api/revalidate" target="_blank">Revalidate Cache</a></li>
								<li>
									<a href="https://github.com/settings/tokens" target="_blank">GitHub Tokens</a>
								</li>
							</ul>
						{:else}
							<p class="disabled-notice">Development tools are only available in dev mode</p>
						{/if}
					</div>

					<div class="links-section">
						<h4>Content</h4>
						<ul>
							<li><a href="/content">Content Overview</a></li>
							{#each contentTypes as type}
								<li><a href={`/content/${type}`}>{formatContentType(type)}</a></li>
							{/each}
						</ul>
					</div>

					<div class="links-section">
						<h4>Documentation</h4>
						<ul>
							<li>
								<a href="https://kit.svelte.dev" target="_blank" rel="noopener noreferrer"
									>SvelteKit Docs</a
								>
							</li>
							<li>
								<a
									href="https://github.com/iammatthias/com"
									target="_blank"
									rel="noopener noreferrer">Repository</a
								>
							</li>
						</ul>
					</div>
				</div>
			</div>

			<div class="info-section">
				<h3>Configuration</h3>
				<p>Ensure the following environment variables are set in your <code>.env</code> file:</p>
				<ul>
					<li><code>GITHUB_TOKEN</code> - A GitHub personal access token with repo access</li>
					<li><code>GITHUB_REPO_OWNER</code> - The owner of the repository</li>
					<li><code>GITHUB_REPO_NAME</code> - The name of the repository</li>
					<li>
						<code>GITHUB_CONTENT_PATH</code> - The base path within the repository for content
					</li>
				</ul>
			</div>

			<div class="info-section">
				<h3>Caching System</h3>
				<div class="cache-details">
					<div class="cache-type">
						<h4>Server-Side Cache (ISR)</h4>
						<ul>
							<li>Pages are cached server-side for 1 hour using SvelteKit's ISR</li>
							<li>Benefits all users globally</li>
							<li>Automatically revalidates when content changes</li>
						</ul>
					</div>

					<div class="cache-type">
						<h4>Content Cache</h4>
						<ul>
							<li>In-memory cache for content, files, and tags</li>
							<li>1-hour expiration</li>
							<li>Disabled in development mode</li>
							{#if dev}
								<li>
									Use the "Clear Cache" button above to manually clear the cache during development
								</li>
							{/if}
						</ul>
					</div>

					<div class="cache-type">
						<h4>Cache Invalidation</h4>
						<ul>
							<li>Automatic via GitHub webhooks when content changes</li>
							{#if dev}
								<li>Manual clearing available in development mode</li>
							{:else}
								<li>Production cache is managed automatically</li>
							{/if}
							<li>Always bypassed in development mode</li>
						</ul>
					</div>
				</div>
			</div>
		</div>

		<div class="structure-section">
			<h2>Content Structure</h2>
			<p>Expected structure in GitHub repository:</p>

			<pre><code
					>/content
  /blog
    post-1.md
    post-2.md
  /recipes
    recipe-1.md
  /notes
    note-1.md
  /art
    artwork-1.md</code
				></pre>

			<h3>Frontmatter Format</h3>
			<p>Each markdown file should have frontmatter in this format:</p>

			<pre><code
					>---
title: Example Post Title
slug: 1234567890123-example-post-title
published: false
created: 2024-03-26 10:54
updated: 2024-03-26 11:03
tags:
  - example
  - markdown
  - documentation
excerpt: A brief description of the post content.
---

Content goes here...</code
				></pre>
		</div>
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
	}

	.header h1 {
		font-size: var(--text-3xl);
		font-weight: 700;
		margin-bottom: var(--space-4);
		color: var(--color-text);
	}

	.header p {
		font-size: var(--text-lg);
		color: var(--color-text-secondary);
	}

	.content {
		margin-top: var(--space-8);
	}

	.github-section,
	.structure-section {
		margin-bottom: var(--space-12);
		padding-bottom: var(--space-8);
		border-bottom: 1px solid var(--color-border);
	}

	h2 {
		font-size: var(--text-2xl);
		font-weight: 600;
		margin-bottom: var(--space-4);
		color: var(--color-text);
	}

	h3 {
		font-size: var(--text-xl);
		font-weight: 600;
		margin-top: var(--space-6);
		margin-bottom: var(--space-3);
		color: var(--color-text);
	}

	h4 {
		font-size: var(--text-lg);
		font-weight: 500;
		margin-top: var(--space-4);
		margin-bottom: var(--space-2);
		color: var(--color-text-secondary);
	}

	.links-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-6);
		margin-top: var(--space-4);
	}

	.links-section ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.links-section li {
		margin-bottom: var(--space-2);
	}

	.links-section a {
		color: var(--color-primary);
		text-decoration: none;
		transition: color var(--transition-fast);
	}

	.links-section a:hover {
		color: var(--color-primary-dark);
		text-decoration: underline;
	}

	.disabled-notice {
		color: var(--color-text-secondary);
		font-style: italic;
		font-size: var(--text-sm);
	}

	.alert {
		padding: var(--space-4);
		border-radius: var(--radius-md);
		margin: var(--space-4) 0;
	}

	.alert-warning {
		background-color: var(--color-warning-bg);
		color: var(--color-warning-text);
		border: 1px solid var(--color-warning-border);
	}

	.info-section {
		background-color: var(--color-bg-secondary);
		border-radius: var(--radius-md);
		padding: var(--space-6);
		margin-top: var(--space-8);
	}

	.info-section code {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		padding: var(--space-1) var(--space-2);
		background-color: var(--color-bg);
		border-radius: var(--radius-sm);
		color: var(--color-text);
	}

	.cache-details {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: var(--space-6);
	}

	.cache-type ul {
		list-style: disc;
		padding-left: var(--space-4);
		margin: var(--space-2) 0;
	}

	.cache-type li {
		margin-bottom: var(--space-2);
		color: var(--color-text-secondary);
	}

	pre {
		background-color: var(--color-bg);
		border-radius: var(--radius-md);
		padding: var(--space-4);
		margin: var(--space-4) 0;
		overflow-x: auto;
	}

	code {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--color-text);
	}

	@media (max-width: 768px) {
		.page {
			padding: var(--space-4);
		}

		.header h1 {
			font-size: var(--text-2xl);
		}

		.header p {
			font-size: var(--text-base);
		}

		.cache-details {
			grid-template-columns: 1fr;
		}
	}
</style>
