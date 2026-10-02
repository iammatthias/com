export const NOTHING_ADDRESS = "0x9DfBA83F62cBc57e3E3d86C6BEED1B401669Eb8B" as const;
export const NOTHING_CHAIN_ID = 1;
export const NOTHING_TOKEN_ID = 1n;
export const PRICE_USDC = 100_000_000_000_000n;
export const PRICE_USD = 100_000_000;

export const NOTHING_ABI = [
    "function contractURI() pure returns (string)",
    "function ownerOf(uint256) view returns (address)",
    "function price() view returns (uint256)",
    "function usdc() view returns (address)",
    "function mint() payable",
    "function mintWithUSDC()",
] as const;

export const USDC_ABI = [
    "function allowance(address, address) view returns (uint256)",
    "function approve(address, uint256) returns (bool)",
] as const;

export interface NothingMetadata {
    name: string;
    description: string;
    image: string;
}

function decodeBase64Json(uri: string): unknown {
    const marker = ";base64,";
    const at = uri.indexOf(marker);
    if (at === -1) throw new Error("not a base64 data uri");
    const raw = atob(uri.slice(at + marker.length));
    const bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
}

export function decodeContractUri(uri: string): NothingMetadata {
    const json = decodeBase64Json(uri) as Record<string, unknown>;
    const image = typeof json.image === "string" ? json.image : "";
    const name = typeof json.name === "string" ? json.name : "";
    const description =
        typeof json.description === "string" ? json.description : "";
    if (!image.startsWith("data:image/svg+xml;base64,")) {
        throw new Error("metadata image is not an inline svg");
    }
    return { name, description, image };
}

export function decodeSvg(image: string): string {
    const raw = atob(image.slice("data:image/svg+xml;base64,".length));
    return new TextDecoder().decode(Uint8Array.from(raw, (c) => c.charCodeAt(0)));
}

export function formatEth(wei: bigint, decimals = 2): string {
    const whole = wei / 10n ** 18n;
    const frac = (wei % 10n ** 18n) / 10n ** BigInt(18 - decimals);
    return `${whole.toLocaleString("en-US")}.${String(frac).padStart(decimals, "0")}`;
}

export function formatUsd(amount: number): string {
    return amount.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    });
}
