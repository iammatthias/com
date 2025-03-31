<script lang="ts">
	export let variant: 'primary' | 'secondary' = 'primary';
	export let href: string | undefined = undefined;
	export let type: 'button' | 'submit' | 'reset' = 'button';
	export let disabled: boolean = false;
	export let fullWidth: boolean = false;
</script>

{#if href}
	<a
		{href}
		class="btn"
		class:btn-primary={variant === 'primary'}
		class:btn-secondary={variant === 'secondary'}
		class:full-width={fullWidth}
		{...$$restProps}
	>
		<slot />
	</a>
{:else}
	<button
		{type}
		{disabled}
		class="btn"
		class:btn-primary={variant === 'primary'}
		class:btn-secondary={variant === 'secondary'}
		class:full-width={fullWidth}
		{...$$restProps}
	>
		<slot />
	</button>
{/if}

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-3) var(--space-6);
		font-size: var(--text-base);
		font-weight: 500;
		line-height: 1;
		text-decoration: none;
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
		cursor: pointer;
		border: 1px solid transparent;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-primary {
		background-color: var(--color-button-primary);
		color: var(--color-button-primary-text);
		border-color: var(--color-button-primary);
	}

	.btn-primary:hover:not(:disabled) {
		background-color: var(--color-button-primary-hover);
		color: var(--color-button-primary-text-hover);
		border-color: var(--color-button-primary-hover);
	}

	.btn-secondary {
		background-color: transparent;
		color: var(--color-text-primary);
		border-color: var(--color-border);
	}

	.btn-secondary:hover:not(:disabled) {
		background-color: var(--color-bg-secondary);
		border-color: var(--color-text-primary);
	}

	.full-width {
		width: 100%;
	}

	@media (max-width: 768px) {
		.btn {
			padding: var(--space-2) var(--space-4);
		}
	}
</style>
