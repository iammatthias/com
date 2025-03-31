<script lang="ts">
	export let type: 'error' | 'success' | 'info' | 'warning' = 'info';
	export let dismissible: boolean = false;
	export let title: string | undefined = undefined;

	let visible = true;

	function dismiss() {
		visible = false;
	}
</script>

{#if visible}
	<div
		class="alert"
		class:alert-error={type === 'error'}
		class:alert-success={type === 'success'}
		class:alert-info={type === 'info'}
		class:alert-warning={type === 'warning'}
		role="alert"
	>
		<div class="alert-content">
			{#if title}
				<h3 class="alert-title">{title}</h3>
			{/if}
			<div class="alert-message">
				<slot />
			</div>
		</div>
		{#if dismissible}
			<button class="alert-dismiss" aria-label="Dismiss" on:click={dismiss}>
				<span aria-hidden="true">×</span>
			</button>
		{/if}
	</div>
{/if}

<style>
	.alert {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: var(--space-4);
		border-radius: var(--radius-md);
		margin: var(--space-4) 0;
	}

	.alert-content {
		flex: 1;
	}

	.alert-title {
		margin: 0 0 var(--space-2);
		font-size: var(--text-lg);
		font-weight: 500;
	}

	.alert-message {
		color: inherit;
		margin: 0;
	}

	.alert-dismiss {
		background: none;
		border: none;
		padding: 0;
		margin-left: var(--space-4);
		cursor: pointer;
		color: inherit;
		opacity: 0.6;
		transition: opacity var(--transition-fast);
	}

	.alert-dismiss:hover {
		opacity: 1;
	}

	.alert-error {
		background-color: var(--color-error-bg);
		color: var(--color-error);
		border: 1px solid var(--color-error-border);
	}

	.alert-success {
		background-color: var(--color-success-bg);
		color: var(--color-success);
		border: 1px solid var(--color-success-border);
	}

	.alert-info {
		background-color: var(--color-info-bg);
		color: var(--color-info);
		border: 1px solid var(--color-info-border);
	}

	.alert-warning {
		background-color: var(--color-warning-bg);
		color: var(--color-warning);
		border: 1px solid var(--color-warning-border);
	}
</style>
