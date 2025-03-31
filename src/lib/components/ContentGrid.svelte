<script lang="ts">
	import ContentCard from './ContentCard.svelte';
	import type { ContentItem } from '$lib/types';

	export let items: ContentItem[];
	export let contentType: string;
	export let isDev: boolean = false;
</script>

<div class="card-grid">
	{#each items as item}
		<ContentCard {item} {contentType} {isDev} />
	{/each}
</div>

<style>
	.card-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: var(--space-6);
	}
</style>
