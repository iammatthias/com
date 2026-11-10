export const NOTHING_ADDRESS = "0x9DfBA83F62cBc57e3E3d86C6BEED1B401669Eb8B" as const;
export const PRICE_USD = 100_000_000;

export function formatUsd(amount: number): string {
    return amount.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    });
}
