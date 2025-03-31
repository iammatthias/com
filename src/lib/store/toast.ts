import { writable } from 'svelte/store';

export interface Toast {
	id: string;
	message: string;
	type?: 'info' | 'success' | 'error';
	duration?: number;
	icon?: string;
	timeoutId?: ReturnType<typeof setTimeout>;
}

function createToastStore() {
	const { subscribe, update } = writable<Toast[]>([]);

	function add(toast: Omit<Toast, 'id'>) {
		const id = Date.now().toString();
		update((toasts) => [
			...toasts,
			{
				id,
				...toast,
				duration: toast.duration || 3000
			}
		]);
		return id;
	}

	function remove(id: string) {
		update((toasts) => {
			const toastToRemove = toasts.find((t) => t.id === id);
			if (toastToRemove?.timeoutId) {
				clearTimeout(toastToRemove.timeoutId);
			}
			return toasts.filter((t) => t.id !== id);
		});
	}

	function clear() {
		update((toasts) => {
			toasts.forEach((toast) => {
				if (toast.timeoutId) {
					clearTimeout(toast.timeoutId);
				}
			});
			return [];
		});
	}

	return {
		subscribe,
		add,
		remove,
		clear,
		// Convenience methods
		info: (message: string, duration?: number) => add({ message, type: 'info', duration }),
		success: (message: string, duration?: number) => add({ message, type: 'success', duration }),
		error: (message: string, duration?: number) => add({ message, type: 'error', duration })
	};
}

export const toastStore = createToastStore();
