<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { fly } from 'svelte/transition';
	import { onMount, onDestroy } from 'svelte';
	import { spring } from 'svelte/motion';
	import { scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';
	import type { RouteNode } from '$lib/utils/routes';

	export let routes: RouteNode[] = [];
	let navMounted = false;
	let isOpen = false;
	let isScrolled = false;
	let prevScrollPos = 0;
	let isVisible = true;
	let activeSection: string | null = null;
	let fabY = spring(0);

	// Log routes for debugging
	$: if (routes.length > 0) {
		console.log('Navigation routes loaded:', routes);
	}

	// Update scroll handler
	function handleScroll() {
		const currentScrollPos = window.scrollY;
		isScrolled = currentScrollPos > 0;
		const shouldBeVisible = prevScrollPos > currentScrollPos || currentScrollPos < 50;

		if (isVisible !== shouldBeVisible) {
			isVisible = shouldBeVisible;
			fabY.set(shouldBeVisible ? 0 : 100);
		}

		prevScrollPos = currentScrollPos;
	}

	onMount(() => {
		navMounted = true;

		// Calculate scrollbar width and store it as a CSS variable
		if (browser) {
			const scrollDiv = document.createElement('div');
			scrollDiv.style.width = '100px';
			scrollDiv.style.height = '100px';
			scrollDiv.style.overflow = 'scroll';
			scrollDiv.style.position = 'absolute';
			scrollDiv.style.top = '-9999px';
			document.body.appendChild(scrollDiv);
			const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
			document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
			document.body.removeChild(scrollDiv);
		}

		// Add scroll handler
		handleScroll();
		window.addEventListener('scroll', handleScroll);

		// Initialize theme
		const savedTheme = browser ? localStorage.getItem('theme') : null;
		if (savedTheme === 'dark') {
			document.documentElement.classList.add('dark');
		} else if (savedTheme === 'light') {
			document.documentElement.classList.remove('dark');
		}

		return () => {
			window.removeEventListener('scroll', handleScroll);
			if (browser && isOpen) {
				const scrollY = Math.abs(parseInt(document.body.style.top || '0'));
				document.body.style.position = '';
				document.body.style.width = '';
				document.body.style.top = '';
				document.body.classList.remove('sheet-open');
				window.scrollTo(0, scrollY);
			}
		};
	});

	// Close menu when route changes
	$: if ($page.url.pathname) {
		closeSheet();
	}

	// Toggle dark mode with browser check
	function toggleDarkMode() {
		if (!browser) return;
		const html = document.documentElement;
		const isDark = html.classList.toggle('dark');
		localStorage.setItem('theme', isDark ? 'dark' : 'light');
	}

	function openSheet() {
		isOpen = true;
		if (browser) {
			document.body.classList.add('sheet-open');
			// Lock scroll on both mobile and desktop
			const scrollY = window.scrollY;
			document.body.style.position = 'fixed';
			document.body.style.width = '100%';
			document.body.style.top = `-${scrollY}px`;
		}
	}

	function closeSheet() {
		if (browser && isOpen) {
			const scrollY = Math.abs(parseInt(document.body.style.top || '0'));
			document.body.style.position = '';
			document.body.style.width = '';
			document.body.style.top = '';
			document.body.classList.remove('sheet-open');
			window.scrollTo(0, scrollY);
		}
		isOpen = false;
		activeSection = null;
	}

	function handleLinkClick(event: MouseEvent, href?: string) {
		if (!href) return;
		event.preventDefault();
		closeSheet();
		// Small delay to allow the sheet to close
		setTimeout(() => {
			window.location.href = href;
		}, 100);
	}

	function toggleSheet() {
		if (isOpen) {
			closeSheet();
		} else {
			openSheet();
		}
	}

	function showSection(section: string) {
		activeSection = activeSection === section ? null : section;
	}

	function goBack() {
		activeSection = null;
	}

	// Update body class when sheet is opened/closed
	$: if (browser) {
		if (isOpen && window.innerWidth >= 1024) {
			document.body.classList.add('sheet-open');
		} else {
			document.body.classList.remove('sheet-open');
		}
	}
</script>

<!-- Navigation -->
<div class="nav-container">
	<button
		class="fab-button"
		class:open={isOpen}
		on:click={toggleSheet}
		aria-label={isOpen ? 'Close menu' : 'Open menu'}
		style="transform-origin: center center"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
			class="nav-icon"
			class:rotated={isOpen}
			aria-hidden="true"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d={isOpen ? 'M6 18L18 6M6 6l12 12' : 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'}
			/>
		</svg>
	</button>

	{#if isOpen}
		<div
			class="sheet-backdrop"
			on:click={closeSheet}
			transition:fade={{ duration: 200 }}
			role="button"
			tabindex="0"
			on:keydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					closeSheet();
				}
			}}
		></div>
		<div
			class="bottom-sheet"
			role="dialog"
			transition:scale|local={{
				duration: 250,
				start: 0.98,
				opacity: 1,
				easing: cubicOut
			}}
		>
			<div class="sheet-handle"></div>
			<div class="sheet-content">
				{#if activeSection}
					<div class="sheet-section" in:fly={{ y: 10, duration: 150, delay: 50 }}>
						<button class="back-button" on:click={goBack}>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="back-icon"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
								/>
							</svg>
							<span>Back</span>
						</button>
						<h3>{activeSection}</h3>
						<div class="sheet-links">
							{#each routes.find((r) => r.label === activeSection)?.children || [] as child}
								<a
									href={child.path}
									class="sheet-link"
									class:active={$page.url.pathname === child.path}
									on:click={(e) => handleLinkClick(e, child.path)}
								>
									{child.label}
								</a>
							{/each}
						</div>
					</div>
				{:else}
					<div class="sheet-section" in:fly={{ y: 10, duration: 150, delay: 50 }}>
						<h3>Menu</h3>
						<div class="sheet-links">
							{#each routes as route}
								{#if route.path !== '/'}
									{#if route.children && route.children.length > 0}
										<button class="sheet-link" on:click={() => showSection(route.label)}>
											<span>{route.label}</span>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												stroke-width="1.5"
												stroke="currentColor"
												class="chevron-icon"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M8.25 4.5l7.5 7.5-7.5 7.5"
												/>
											</svg>
										</button>
									{:else}
										<a
											href={route.path}
											class="sheet-link"
											class:active={$page.url.pathname === route.path}
											on:click={(e) => handleLinkClick(e, route.path)}
										>
											{route.label}
										</a>
									{/if}
								{/if}
							{/each}
						</div>
					</div>
					<div class="sheet-section" in:fly={{ y: 10, duration: 150, delay: 50 }}>
						<h3>Settings</h3>
						<button class="sheet-link" on:click={toggleDarkMode}>
							<span>Theme</span>
							<div class="theme-icons">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="currentColor"
									class="theme-icon sun"
								>
									<path
										d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"
									/>
								</svg>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="currentColor"
									class="theme-icon moon"
								>
									<path
										fill-rule="evenodd"
										d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z"
										clip-rule="evenodd"
									/>
								</svg>
							</div>
						</button>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	/* Navigation Styles */
	.nav-container {
		position: fixed;
		z-index: 9999;
		padding: 1rem;
		display: flex;
		justify-content: center;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	/* Position the container based on viewport size */
	@media (min-width: 1024px) {
		.nav-container {
			top: 1.5rem;
			right: 2.5rem;
			left: auto;
			bottom: auto;
			padding: 0;
		}
	}

	@media (max-width: 1023px) {
		.nav-container {
			bottom: 0;
			left: 0;
			right: 0;
			padding-bottom: calc(1rem + env(safe-area-inset-bottom, 1rem));
		}
	}

	.fab-button {
		position: fixed;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3.5rem;
		height: 3.5rem;
		border-radius: 50%;
		background-color: var(--color-bg-primary);
		color: var(--color-text-primary);
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-lg);
		cursor: pointer;
		z-index: 10001;
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		transform: translateZ(0);
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
		will-change: transform, background-color, border-color, box-shadow;
	}

	/* Position the FAB button based on viewport size */
	@media (min-width: 1024px) {
		.fab-button {
			top: 1.5rem;
			right: 2.5rem;
		}
	}

	@media (max-width: 1023px) {
		.fab-button {
			bottom: 1rem;
			left: 50%;
			transform: translateX(-50%);
			margin-bottom: env(safe-area-inset-bottom, 0.5rem);
		}
	}

	.fab-button.open {
		background-color: transparent;
		border-color: transparent;
		box-shadow: none;
	}

	.nav-icon {
		width: 1.5rem;
		height: 1.5rem;
		transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		will-change: transform;
	}

	.nav-icon.rotated {
		transform: rotate(180deg);
	}

	.sheet-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 9998;
		cursor: pointer;
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		will-change: opacity;
	}

	@media (min-width: 1024px) {
		.sheet-backdrop {
			background-color: transparent;
			pointer-events: none;
			backdrop-filter: none;
			-webkit-backdrop-filter: none;
		}
	}

	.bottom-sheet {
		position: fixed;
		background-color: var(--color-bg-primary);
		z-index: 10000;
		overflow: hidden;
		box-shadow: var(--shadow-xl);
		border: 1px solid var(--color-border);
		transform: translateZ(0);
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
		will-change: transform;
		transform-style: preserve-3d;
		perspective: 1000px;
	}

	@media (min-width: 1024px) {
		.bottom-sheet {
			width: 320px;
			top: 5.5rem;
			right: 2.5rem;
			border-radius: 1rem;
			max-height: calc(100vh - 7rem);
			transform-origin: top right;
		}

		.sheet-content {
			max-height: calc(100vh - 9rem);
		}
	}

	@media (max-width: 1023px) {
		.bottom-sheet {
			left: 0;
			right: 0;
			bottom: 0;
			width: 100%;
			border-radius: 1.5rem 1.5rem 0 0;
			padding-bottom: calc(4rem + env(safe-area-inset-bottom, 0.5rem));
			max-height: 90vh;
			transform-origin: bottom center;
			transform: translate3d(0, 0, 0);
			transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
			will-change: transform;
		}

		.sheet-content {
			max-height: calc(90vh - 6rem);
			transform: translate3d(0, 0, 0);
			will-change: transform;
			-webkit-overflow-scrolling: touch;
		}
	}

	.sheet-content {
		padding: 1.5rem;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
		overscroll-behavior: contain;
		transform: translateZ(0);
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
	}

	.sheet-handle {
		width: 2rem;
		height: 0.25rem;
		background-color: var(--color-border);
		border-radius: 1rem;
		margin: 0.75rem auto;
	}

	@media (min-width: 1024px) {
		.sheet-handle {
			display: none;
		}
	}

	.sheet-section {
		margin-bottom: 2rem;
	}

	.sheet-section h3 {
		font-size: var(--text-lg);
		font-weight: 600;
		margin-bottom: 1.25rem;
		color: var(--color-text-primary);
	}

	.sheet-links {
		display: grid;
		gap: 0.75rem;
	}

	.sheet-link {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 1rem 1.25rem;
		color: var(--color-text-secondary);
		text-decoration: none;
		border: none;
		background: var(--color-bg-secondary);
		border-radius: var(--radius-lg);
		font-size: var(--text-base);
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.sheet-link:hover,
	.sheet-link:active,
	.sheet-link.active {
		color: var(--color-text-primary);
		background: var(--color-bg-tertiary);
	}

	.back-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-text-secondary);
		background: none;
		border: none;
		padding: 0;
		margin-bottom: 1.25rem;
		font-size: var(--text-base);
		cursor: pointer;
		transition: color 0.2s ease;
	}

	.back-button:hover,
	.back-button:active {
		color: var(--color-text-primary);
	}

	.back-icon {
		width: 1.25rem;
		height: 1.25rem;
	}

	.theme-icons {
		display: flex;
		align-items: center;
	}

	.theme-icon {
		width: 1.5rem;
		height: 1.5rem;
	}

	/* Theme icon display rules */
	:global(.dark) .theme-icon.sun {
		display: block;
	}

	:global(.dark) .theme-icon.moon {
		display: none;
	}

	:global(:not(.dark)) .theme-icon.sun {
		display: none;
	}

	:global(:not(.dark)) .theme-icon.moon {
		display: block;
	}

	.chevron-icon {
		width: 1.25rem;
		height: 1.25rem;
	}

	/* Handle scrollbar layout shift */
	:global(body.sheet-open) {
		@media (min-width: 1024px) {
			padding-right: var(--scrollbar-width, 0px);
			overflow: hidden;
		}
	}

	:global(body.sheet-open .nav-container) {
		@media (min-width: 1024px) {
			right: calc(2.5rem + var(--scrollbar-width, 0px));
		}
	}

	:global(body.sheet-open .bottom-sheet) {
		@media (min-width: 1024px) {
			right: calc(2.5rem + var(--scrollbar-width, 0px));
		}
	}

	:global(body.sheet-open .fab-button) {
		@media (min-width: 1024px) {
			right: calc(2.5rem + var(--scrollbar-width, 0px));
		}
	}
</style>
