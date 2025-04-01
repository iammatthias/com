<script lang="ts">
	import { page } from '$app/stores';
	import Button from './Button.svelte';

	export let totalItems: number;
	export let itemsPerPage: number = 10;
	export let currentPage: number = 1;

	$: totalPages = Math.ceil(totalItems / itemsPerPage);
	$: showPagination = totalPages > 1;
	$: hasPrevious = currentPage > 1;
	$: hasNext = currentPage < totalPages;

	// Generate page numbers to display
	$: pageNumbers = generatePageNumbers(currentPage, totalPages);

	function generatePageNumbers(current: number, total: number) {
		const delta = 2; // Number of pages to show on each side of current page
		const range: number[] = [];
		const rangeWithDots: (number | string)[] = [];
		let l: number | undefined;

		for (let i = 1; i <= total; i++) {
			if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
				range.push(i);
			}
		}

		for (let i of range) {
			if (l !== undefined) {
				if (i - l === 2) {
					rangeWithDots.push(l + 1);
				} else if (i - l !== 1) {
					rangeWithDots.push('...');
				}
			}
			rangeWithDots.push(i);
			l = i;
		}

		return rangeWithDots;
	}

	$: currentUrl = $page.url;
	$: getPageUrl = (pageNum: number) => {
		const url = new URL(currentUrl);
		url.searchParams.set('page', pageNum.toString());
		return url.toString();
	};
</script>

{#if showPagination}
	<nav class="pagination" aria-label="Pagination">
		<div class="pagination-controls">
			{#if hasPrevious}
				<Button href={getPageUrl(currentPage - 1)} variant="secondary" aria-label="Previous page">
					← Previous
				</Button>
			{/if}

			<div class="page-numbers">
				{#each pageNumbers as pageNum}
					{#if typeof pageNum === 'number'}
						<a
							href={getPageUrl(pageNum)}
							class="page-number"
							class:active={pageNum === currentPage}
							aria-current={pageNum === currentPage ? 'page' : undefined}
						>
							{pageNum}
						</a>
					{:else}
						<span class="dots">{pageNum}</span>
					{/if}
				{/each}
			</div>

			{#if hasNext}
				<Button href={getPageUrl(currentPage + 1)} variant="secondary" aria-label="Next page">
					Next →
				</Button>
			{/if}
		</div>

		<div class="pagination-info">
			<p>
				Page {currentPage} of {totalPages}
				<span class="total-items">({totalItems} items)</span>
			</p>
		</div>
	</nav>
{/if}

<style>
	.pagination {
		margin-top: var(--space-8);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		align-items: center;
	}

	.pagination-controls {
		display: flex;
		gap: var(--space-4);
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
	}

	.page-numbers {
		display: flex;
		gap: var(--space-2);
		align-items: center;
	}

	.page-number {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 2.5rem;
		height: 2.5rem;
		padding: 0 var(--space-2);
		border-radius: var(--radius-md);
		text-decoration: none;
		color: var(--color-text-primary);
		background: transparent;
		border: 1px solid var(--color-border);
		transition: all var(--transition-fast);
	}

	.page-number:hover {
		background-color: var(--color-bg-secondary);
		border-color: var(--color-text-primary);
	}

	.page-number.active {
		background-color: var(--color-button-primary);
		color: var(--color-button-primary-text);
		border-color: var(--color-button-primary);
	}

	.dots {
		color: var(--color-text-tertiary);
		padding: 0 var(--space-1);
	}

	.pagination-info {
		font-size: var(--text-sm);
		color: var(--color-text-tertiary);
	}

	.total-items {
		color: var(--color-text-secondary);
	}

	@media (max-width: 768px) {
		.pagination-controls {
			gap: var(--space-2);
		}

		.page-numbers {
			display: none;
		}

		.pagination-info {
			text-align: center;
		}
	}
</style>
