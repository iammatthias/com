const RETRY_DELAYS_MS = [400, 1600];

export async function importWithRetry<T>(path: string): Promise<T> {
    const url = new URL(path, location.origin);
    for (let attempt = 0; ; attempt++) {
        if (attempt > 0) url.searchParams.set("retry", String(attempt));
        try {
            return await import(/* @vite-ignore */ url.href);
        } catch (error) {
            const delay = RETRY_DELAYS_MS[attempt];
            if (delay === undefined) throw error;
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
}
