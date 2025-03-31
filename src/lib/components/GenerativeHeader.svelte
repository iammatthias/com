<!-- A generative art header component that creates deterministic patterns based on a seed -->
<script lang="ts">
	import { generatePatternData, generateColors } from '$lib/utils/generative-header';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	export let seed: string;
	export let className = '';
	export let darkMode = false;

	// Ensure we have a valid seed and initialize with desktop patterns
	$: safeSeed = seed || 'default';
	$: isMobile = browser ? window.innerWidth <= 768 : false;
	$: patterns = generateSafePatterns(safeSeed, isMobile);
	$: colors = generateColors(safeSeed);

	let container: HTMLDivElement;

	// Generate patterns with proper error handling
	function generateSafePatterns(
		seed: string,
		isMobile: boolean
	): ReturnType<typeof generatePatternData> {
		try {
			const result = generatePatternData(seed, isMobile);
			if (!result.background || !result.patterns) {
				throw new Error('Invalid pattern data generated');
			}
			return result;
		} catch (error) {
			console.error('Error generating patterns:', error);
			return {
				background: [],
				regions: [],
				patterns: [
					{
						type: 'cells',
						elements: []
					}
				]
			};
		}
	}

	onMount(() => {
		if (!browser) return;

		// Debounced resize handler
		let resizeTimer: ReturnType<typeof setTimeout>;
		const handleResize = () => {
			clearTimeout(resizeTimer);
			resizeTimer = setTimeout(() => {
				if (container) {
					isMobile = window.innerWidth <= 768;
				}
			}, 250);
		};

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
			clearTimeout(resizeTimer);
		};
	});
</script>

<div class="generative-header {className}" class:dark={darkMode} bind:this={container}>
	{#if patterns.background && patterns.patterns && colors.length > 0}
		<svg
			class="header-svg"
			viewBox={isMobile ? '-10 -10 380 260' : '-10 -10 670 260'}
			preserveAspectRatio="xMidYMid slice"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<!-- Background -->
			<rect
				x="-10"
				y="-10"
				width={isMobile ? 380 : 670}
				height="260"
				fill={colors[0]}
				opacity="0.15"
			/>

			<!-- Background Pattern -->
			{#each patterns.background as path}
				<path d={path} fill={colors[1]} opacity="0.15" />
			{/each}

			<!-- Primary Regions with Patterns -->
			{#each patterns.patterns as pattern, i}
				{#if pattern.type === 'cells'}
					{#each pattern.elements as path}
						<path d={path} fill={colors[1 + (i % (colors.length - 1))]} opacity="0.95" />
					{/each}
				{:else}
					{#each pattern.elements as path}
						<path
							d={path}
							fill="none"
							stroke={colors[1 + (i % (colors.length - 1))]}
							stroke-width="0.4"
							opacity="0.9"
						/>
					{/each}
				{/if}
			{/each}
		</svg>
	{/if}
</div>

<style>
	.generative-header {
		width: 100%;
		position: relative;
		overflow: hidden;
		border: 1px solid currentColor;
		background: transparent;
		aspect-ratio: 65/24;
	}

	.header-svg {
		display: block;
		width: 100%;
		height: 100%;
	}

	/* Mobile optimization */
	@media (max-width: 768px) {
		.generative-header {
			aspect-ratio: 9/6;
		}
	}

	/* Print styles */
	@media print {
		.generative-header {
			display: none;
		}
	}
</style>
