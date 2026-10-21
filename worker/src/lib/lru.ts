/**
 * A bounded map that drops the least recently used entry. Module-level instances
 * outlive requests, so they may only hold plain data, never I/O objects.
 */
export class Lru<K, V> {
    private readonly map = new Map<K, V>();

    constructor(private readonly max: number) {}

    get(key: K): V | undefined {
        const value = this.map.get(key);
        if (value === undefined) return undefined;
        // re-insert: Map order is the eviction order
        this.map.delete(key);
        this.map.set(key, value);
        return value;
    }

    set(key: K, value: V): void {
        this.map.delete(key);
        this.map.set(key, value);
        if (this.map.size > this.max) this.map.delete(this.map.keys().next().value as K);
    }

    get size(): number {
        return this.map.size;
    }
}
