export function pLimit(concurrency: number) {
    let active = 0;
    const queue: Array<() => void> = [];
    const next = () => {
        if (active >= concurrency) return;
        const run = queue.shift();
        if (run) run();
    };
    return <T>(fn: () => Promise<T>): Promise<T> =>
        new Promise<T>((resolve, reject) => {
            queue.push(() => {
                active++;
                fn()
                    .then(resolve, reject)
                    .finally(() => {
                        active--;
                        next();
                    });
            });
            next();
        });
}
