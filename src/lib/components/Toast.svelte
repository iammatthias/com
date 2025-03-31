<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { toastStore, type Toast } from '$lib/store/toast';

	// Auto-dismiss toasts after a certain duration
	onMount(() => {
		const unsubscribe = toastStore.subscribe((toasts: Toast[]) => {
			if (toasts.length > 0) {
				toasts.forEach((toast: Toast) => {
					if (!toast.timeoutId && toast.duration) {
						const timeoutId = setTimeout(() => {
							toastStore.remove(toast.id);
						}, toast.duration);
						toast.timeoutId = timeoutId;
					}
				});
			}
		});

		return () => {
			unsubscribe();
		};
	});
</script>

<div class="toast-container">
	{#each $toastStore as toast (toast.id)}
		<div
			class="toast {toast.type || 'info'}"
			in:fly={{ y: 50, duration: 300 }}
			out:fade={{ duration: 200 }}
			role="alert"
		>
			<div class="toast-content">
				{#if toast.icon}
					<span class="toast-icon">{toast.icon}</span>
				{/if}
				<span class="toast-message">{toast.message}</span>
			</div>
		</div>
	{/each}
</div>

<style>
	.toast-container {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		z-index: 9999;
		padding: 0 1rem 1rem;
	}

	.toast {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.75rem 1rem;
		background-color: var(--color-bg-primary);
		border-top: 1px solid var(--color-border);
		font-size: var(--text-sm);
		text-align: center;
		box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
	}

	.toast.success {
		border-left: 3px solid var(--color-success, #10b981);
	}

	.toast.error {
		border-left: 3px solid var(--color-error, #ef4444);
	}

	.toast.info {
		border-left: 3px solid var(--color-accent);
	}

	.toast-content {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.toast-message {
		color: var(--color-text-primary);
	}

	/* Desktop styles */
	@media (min-width: 768px) {
		.toast-container {
			bottom: 1.5rem;
			right: 1.5rem;
			left: auto;
			width: auto;
			max-width: 320px;
			padding: 0;
		}

		.toast {
			border-radius: var(--radius-sm);
			border: 1px solid var(--color-border);
			justify-content: flex-start;
			text-align: left;
		}
	}
</style>
