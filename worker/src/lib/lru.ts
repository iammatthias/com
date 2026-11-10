export class Lru<K, V> {
    private readonly map = new Map<K, V>();

    constructor(private readonly max: number) {}

    get(key: K): V | undefined {
        const value = this.map.get(key);
        if (value === undefined) return undefined;
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
