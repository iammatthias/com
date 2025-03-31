<script lang="ts">
	import { fade } from 'svelte/transition';
	import type { PageData } from './$types';
	import type { NavItem, NavSection } from '$lib/types/nav';

	export let data: PageData;

	$: ({ sections, currentPath } = data);
	$: isActive = (href: string) => currentPath === href || currentPath.startsWith(href + '/');
</script>

<div class="page" in:fade>
	<section class="breadcrumbs">
		<a href="/">Home</a>
		<span>/</span>
		<span>Bio</span>
	</section>

	<section class="header">
		<h1>Bio</h1>
		<p>Welcome to my personal space. Here you can learn more about me and get in touch.</p>
	</section>

	<nav class="site-nav" aria-label="Site navigation">
		{#each sections as section}
			<div class="nav-section">
				{#each section.items as item (item.href)}
					<a
						href={item.href}
						class="nav-card"
						class:active={isActive(item.href)}
						data-sveltekit-preload
						aria-current={isActive(item.href) ? 'page' : undefined}
					>
						{#if item.icon}
							<span class="icon" aria-hidden="true">{item.icon}</span>
						{/if}
						<div class="nav-content">
							<h2>{item.label}</h2>
							<p>{item.description}</p>
						</div>
					</a>
				{/each}
			</div>
		{/each}
	</nav>
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

	.site-nav {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
		margin-top: var(--space-8);
		max-width: 800px;
		margin-inline: auto;
	}

	.nav-section {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: var(--space-4);
	}

	.nav-card {
		display: flex;
		align-items: flex-start;
		gap: var(--space-4);
		padding: var(--space-4);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		text-decoration: none;
		color: var(--color-text);
		transition: all 0.2s;
		background-color: var(--color-bg);
	}

	.nav-card:hover {
		border-color: var(--color-primary);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.nav-card.active {
		border-color: var(--color-primary);
		background-color: var(--color-bg-hover);
	}

	.icon {
		flex-shrink: 0;
		font-size: 1.5rem;
		color: var(--color-text-secondary);
	}

	.nav-content {
		flex-grow: 1;
	}

	.nav-content h2 {
		font-size: 1.25rem;
		margin: 0 0 var(--space-2);
	}

	.nav-content p {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		margin: 0;
		line-height: 1.5;
	}

	@media (max-width: 640px) {
		.nav-section {
			grid-template-columns: 1fr;
		}

		.nav-card {
			padding: var(--space-3);
		}
	}
</style>
