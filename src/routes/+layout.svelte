<script lang="ts">
	import '../lib/styles/global.css';
	import '../lib/styles/components.css';
	import '../lib/styles/content.css';
	import Toast from '$lib/components/Toast.svelte';
	import Navigation from '$lib/components/Navigation.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import type { LayoutData } from './$types';

	export let data: LayoutData;

	// Extract published content types from routes
	$: publishedContentTypes = data.routes
		? data.routes
				.find((route) => route.path === '/content')
				?.children?.map((child) => child.path.split('/').pop() || '') || []
		: [];
</script>

<div class="site-layout">
	<Navigation routes={data.routes} />

	<main class="site-main">
		<div class="main-content">
			<slot />
		</div>
	</main>

	<Footer {publishedContentTypes} />

	<Toast />
</div>

<style>
	.site-layout {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		container-type: inline-size;
	}

	.site-main {
		flex: 1;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-block: var(--container-padding-y);
	}

	.main-content {
		width: 100%;
		max-width: var(--max-width);
		padding-inline: var(--container-padding-x);
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	@media (max-width: 768px) {
		.site-main {
			padding-block: var(--container-padding-y);
		}
	}
</style>
