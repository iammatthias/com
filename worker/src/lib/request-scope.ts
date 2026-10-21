import { AsyncLocalStorage } from "node:async_hooks";

/**
 * workerd ties every I/O object to the request that created it. A promise
 * or queued fetch started by one request and awaited by another hangs when
 * the first request finishes ("code had hung"). Module-level coalescing
 * (memo in-flight loads, the upstream concurrency queue) is therefore
 * scoped to the current request; resolved plain data is still shared.
 */
interface Scope {
    id: number;
    values: Map<string, unknown>;
}

const als = new AsyncLocalStorage<Scope>();
let next = 0;

export function runInRequest<T>(fn: () => T): T {
    return als.run({ id: ++next, values: new Map() }, fn);
}

export function requestScopeId(): number {
    return als.getStore()?.id ?? 0;
}

const unscoped = new Map<string, unknown>();

export function perRequest<T>(key: string, make: () => T): T {
    const values = als.getStore()?.values ?? unscoped;
    if (!values.has(key)) values.set(key, make());
    return values.get(key) as T;
}

interface WaitUntil {
    waitUntil(promise: Promise<unknown>): void;
}

/** The current request's ExecutionContext, for work that may outlive its response. */
export function bindExecution(exec: WaitUntil): void {
    als.getStore()?.values.set("exec", exec);
}

/**
 * Work whose outcome the response doesn't depend on (cache writes): handed to waitUntil
 * when the request's context is bound, awaited otherwise (tests, scripts). Never throws.
 */
export async function afterResponse(work: () => Promise<unknown>): Promise<void> {
    const quiet = Promise.resolve().then(work).then(
        () => undefined,
        () => undefined,
    );
    const exec = als.getStore()?.values.get("exec") as WaitUntil | undefined;
    if (exec) exec.waitUntil(quiet);
    else await quiet;
}
