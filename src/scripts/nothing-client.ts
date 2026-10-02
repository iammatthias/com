import {
    createPublicClient,
    createWalletClient,
    custom,
    fallback,
    http,
    parseAbi,
    type Address,
} from "viem";
import { mainnet } from "viem/chains";
import {
    NOTHING_ABI,
    NOTHING_ADDRESS,
    NOTHING_CHAIN_ID,
    NOTHING_TOKEN_ID,
    PRICE_USDC,
    USDC_ABI,
    decodeContractUri,
    formatEth,
} from "@lib/nothing-contract";

const RPCS = [
    "https://ethereum-rpc.publicnode.com",
    "https://cloudflare-eth.com",
];

const abi = parseAbi(NOTHING_ABI);
const usdcAbi = parseAbi(USDC_ABI);

const publicClient = createPublicClient({
    chain: mainnet,
    transport: fallback(RPCS.map((url) => http(url))),
});

type Eip1193 = { request(args: { method: string; params?: unknown[] }): Promise<unknown> };

function injected(): Eip1193 | null {
    const w = window as unknown as { ethereum?: Eip1193 };
    return w.ethereum ?? null;
}

function setState(host: HTMLElement, state: string): void {
    host.dataset.state = state;
}

function say(host: HTMLElement, selector: string, text: string): void {
    const el = host.querySelector<HTMLElement>(selector);
    if (el) el.textContent = text;
}

async function paintArtwork(host: HTMLElement): Promise<void> {
    const uri = await publicClient.readContract({
        address: NOTHING_ADDRESS,
        abi,
        functionName: "contractURI",
    });
    const meta = decodeContractUri(uri as string);
    const canvas = host.querySelector<HTMLElement>("[data-nothing-canvas]");
    if (!canvas) return;
    const img = document.createElement("img");
    img.src = meta.image;
    img.width = 600;
    img.height = 600;
    img.alt = meta.name;
    img.decoding = "async";
    canvas.replaceChildren(img);
}

async function readOwner(): Promise<Address | null> {
    try {
        return (await publicClient.readContract({
            address: NOTHING_ADDRESS,
            abi,
            functionName: "ownerOf",
            args: [NOTHING_TOKEN_ID],
        })) as Address;
    } catch {
        return null;
    }
}

async function readPrice(): Promise<bigint | null> {
    try {
        return (await publicClient.readContract({
            address: NOTHING_ADDRESS,
            abi,
            functionName: "price",
        })) as bigint;
    } catch {
        return null;
    }
}

function buttons(host: HTMLElement): HTMLButtonElement[] {
    return [...host.querySelectorAll<HTMLButtonElement>("[data-nothing-mint]")];
}

async function refresh(host: HTMLElement): Promise<boolean> {
    const [owner, price] = await Promise.all([readOwner(), readPrice()]);

    if (owner) {
        setState(host, "minted");
        say(host, "[data-nothing-status]", `minted by ${owner.slice(0, 6)}…${owner.slice(-4)}`);
        say(host, "[data-nothing-eth]", "—");
        for (const b of buttons(host)) b.disabled = true;
        const link = host.querySelector<HTMLAnchorElement>(".nothing-fallback a");
        if (link) {
            link.href = `https://etherscan.io/nft/${NOTHING_ADDRESS}/1`;
            link.textContent = "View the token on Etherscan";
        }
        return true;
    }

    setState(host, "ready");
    say(host, "[data-nothing-status]", "unminted");
    say(host, "[data-nothing-eth]", price === null ? "feed unavailable" : `${formatEth(price)} ETH`);
    for (const b of buttons(host)) {
        b.disabled = b.dataset.nothingMint === "eth" && price === null;
    }
    return false;
}

async function ensureMainnet(provider: Eip1193): Promise<boolean> {
    const chainId = (await provider.request({ method: "eth_chainId" })) as string;
    if (Number.parseInt(chainId, 16) === NOTHING_CHAIN_ID) return true;
    try {
        await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x1" }],
        });
        return true;
    } catch {
        return false;
    }
}

async function mint(host: HTMLElement, kind: string): Promise<void> {
    const provider = injected();
    if (!provider) {
        say(host, "[data-nothing-note]", "No Ethereum wallet detected in this browser.");
        return;
    }

    const note = (t: string) => say(host, "[data-nothing-note]", t);
    const busy = (on: boolean) => {
        for (const b of buttons(host)) b.disabled = on;
        setState(host, on ? "pending" : "ready");
    };

    try {
        busy(true);
        note("Confirm in your wallet…");

        const [account] = (await provider.request({
            method: "eth_requestAccounts",
        })) as Address[];
        if (!account) throw new Error("No account authorised.");

        if (!(await ensureMainnet(provider))) {
            setState(host, "wrong-chain");
            note("NOTHING lives on Ethereum mainnet. Switch networks to mint.");
            await refresh(host);
            return;
        }

        const wallet = createWalletClient({
            account,
            chain: mainnet,
            transport: custom(provider),
        });

        if (kind === "eth") {
            const price = await readPrice();
            if (price === null) throw new Error("The Chainlink feed is stale; ETH minting is unavailable.");
            const value = (price * 101n) / 100n;
            note(`Sending ${formatEth(value)} ETH — the contract refunds the excess.`);
            const hash = await wallet.writeContract({
                address: NOTHING_ADDRESS,
                abi,
                functionName: "mint",
                value,
            });
            note("Waiting for confirmation…");
            await publicClient.waitForTransactionReceipt({ hash });
        } else {
            const usdc = (await publicClient.readContract({
                address: NOTHING_ADDRESS,
                abi,
                functionName: "usdc",
            })) as Address;

            const allowance = (await publicClient.readContract({
                address: usdc,
                abi: usdcAbi,
                functionName: "allowance",
                args: [account, NOTHING_ADDRESS],
            })) as bigint;

            if (allowance < PRICE_USDC) {
                note("Step 1 of 2: approving 100,000,000 USDC…");
                const approval = await wallet.writeContract({
                    address: usdc,
                    abi: usdcAbi,
                    functionName: "approve",
                    args: [NOTHING_ADDRESS, PRICE_USDC],
                });
                await publicClient.waitForTransactionReceipt({ hash: approval });
            }

            note("Step 2 of 2: minting…");
            const hash = await wallet.writeContract({
                address: NOTHING_ADDRESS,
                abi,
                functionName: "mintWithUSDC",
            });
            note("Waiting for confirmation…");
            await publicClient.waitForTransactionReceipt({ hash });
        }

        note("Minted.");
        await refresh(host);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        note(message.split("\n")[0].slice(0, 160));
        await refresh(host);
    } finally {
        busy(false);
        await refresh(host);
    }
}

async function mount(host: HTMLElement): Promise<void> {
    try {
        await paintArtwork(host);
    } catch {
        setState(host, "unreachable");
        say(host, "[data-nothing-status]", "could not reach Ethereum");
        return;
    }

    let minted = await refresh(host);

    for (const b of buttons(host)) {
        b.addEventListener("click", () => {
            void mint(host, b.dataset.nothingMint ?? "eth");
        });
    }

    const timer = window.setInterval(async () => {
        if (minted) {
            window.clearInterval(timer);
            return;
        }
        minted = await refresh(host);
    }, 20_000);
}

for (const host of document.querySelectorAll<HTMLElement>("ff-nothing")) {
    void mount(host);
}
