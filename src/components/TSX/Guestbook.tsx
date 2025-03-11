import React, { useEffect, useState } from "react";
import { parseEther, parseAbiItem } from "viem";
import { baseSepolia } from "wagmi/chains";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useEnsName,
  usePublicClient,
  useWatchContractEvent,
} from "wagmi";
import WagmiProvider from "@/lib/WagmiProvider";
import styles from "./Guestbook.module.css";
import { ConnectButton } from "@rainbow-me/rainbowkit";

// Replace with your deployed contract address.
const contractAddress = "0x7327468bf87Bed17Ffb2946d460810051eF43C35" as const;

// ABI fragment for the guestbook contract.
const guestbookABI = [
  {
    inputs: [],
    name: "getGuestCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bool", name: "mintNFT", type: "bool" }],
    name: "signGuestbookGm",
    outputs: [
      { internalType: "uint256", name: "guestId", type: "uint256" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "message", type: "string" },
      { internalType: "bool", name: "mintNFT", type: "bool" },
    ],
    name: "signGuestbookCustom",
    outputs: [
      { internalType: "uint256", name: "guestId", type: "uint256" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    type: "event",
    name: "GuestbookSigned",
    inputs: [
      { indexed: true, internalType: "uint256", name: "guestId", type: "uint256" },
      { indexed: true, internalType: "address", name: "guest", type: "address" },
      { indexed: false, internalType: "string", name: "message", type: "string" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "tokenId", type: "uint256" },
    ],
  },
] as const;

// Define a type for the guestbook event that matches GuestbookSignedEvent
interface GuestbookEvent {
  guestId: bigint;
  guest: `0x${string}`;
  message: string;
  timestamp: bigint;
  tokenId: bigint;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
}

const GuestbookContent: React.FC = () => {
  const [events, setEvents] = useState<GuestbookEvent[]>([]);
  const [customMessage, setCustomMessage] = useState<string>("gm");
  const [mintNFT, setMintNFT] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  const { isConnected, chain } = useAccount();
  const publicClient = usePublicClient();

  // Contract writes
  const { writeContract: writeGm, isPending: isGmPending, data: gmHash } = useWriteContract();
  const { writeContract: writeCustom, isPending: isCustomPending, data: customHash } = useWriteContract();

  // Transaction status
  const { isLoading: isGmConfirming, isSuccess: isGmSuccess } = useWaitForTransactionReceipt({
    hash: gmHash,
    chainId: baseSepolia.id,
  });

  const { isLoading: isCustomConfirming, isSuccess: isCustomSuccess } = useWaitForTransactionReceipt({
    hash: customHash,
    chainId: baseSepolia.id,
  });

  const isLoading = isGmPending || isCustomPending || isGmConfirming || isCustomConfirming;

  // Check if connected to correct network - only show if connected
  const isWrongNetwork = isConnected && chain?.id !== baseSepolia.id;

  // Check if contract is paused
  const { data: isPaused } = useReadContract({
    address: contractAddress,
    abi: guestbookABI,
    functionName: "paused",
    chainId: baseSepolia.id, // Explicitly set chain ID
  });

  // Sanitize message input
  const sanitizeMessage = (input: string): string => {
    // Remove HTML tags and entities
    const noHtml = input.replace(/<[^>]*>|&[^;]+;/g, "");

    // Remove control characters and normalize whitespace
    const normalized = noHtml
      .replace(/[\x00-\x1F\x7F-\x9F]/g, "") // Remove control characters
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    // Ensure the message is within valid UTF-8 range and length
    return normalized.slice(0, 140);
  };

  // Sign the guestbook with "gm"
  const signGuestbookGm = async () => {
    if (isPaused) {
      setError("The guestbook is currently paused. Please try again later.");
      return;
    }

    try {
      const value = mintNFT ? parseEther("0.00111") : 0n;
      writeGm({
        address: contractAddress,
        abi: guestbookABI,
        functionName: "signGuestbookGm",
        args: [mintNFT],
        value,
        chainId: baseSepolia.id,
      });
    } catch (err) {
      console.error("Error signing guestbook:", err);
      setError(getErrorMessage(err));
    }
  };

  // Sign the guestbook with a custom message
  const signGuestbookCustom = async () => {
    if (isPaused) {
      setError("The guestbook is currently paused. Please try again later.");
      return;
    }

    const sanitized = sanitizeMessage(customMessage);

    if (!sanitized) {
      setError("Please enter a valid message");
      return;
    }
    if (sanitized.length > 140) {
      setError("Message must be 140 characters or less");
      return;
    }

    try {
      const value = parseEther("0.00111") + (mintNFT ? parseEther("0.00111") : 0n);
      writeCustom({
        address: contractAddress,
        abi: guestbookABI,
        functionName: "signGuestbookCustom",
        args: [sanitized, mintNFT],
        value,
        chainId: baseSepolia.id,
      });
    } catch (err) {
      console.error("Error signing guestbook:", err);
      setError(getErrorMessage(err));
    }
  };

  // Helper to get user-friendly error messages
  const getErrorMessage = (error: any): string => {
    const msg = error?.message || "Unknown error occurred";

    if (msg.includes("insufficient funds")) {
      return "You don't have enough ETH for this transaction";
    }

    if (msg.includes("user rejected transaction")) {
      return "Transaction was cancelled";
    }

    if (msg.includes("user rejected request")) {
      return "Network switch was cancelled";
    }

    if (msg.includes("InsufficientFee")) {
      return "Insufficient fee provided for this operation";
    }

    if (msg.includes("EmptyMessage")) {
      return "Message cannot be empty";
    }

    if (msg.includes("MessageTooLong")) {
      return "Message exceeds 140 characters";
    }

    if (msg.includes("ContractPaused")) {
      return "The guestbook is currently paused";
    }

    return "Failed to sign guestbook. Please try again.";
  };

  const fetchLatestEvents = async () => {
    if (!publicClient) return;
    try {
      const logs = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem(
          "event GuestbookSigned(uint256 indexed guestId, address indexed guest, string message, uint256 timestamp, uint256 tokenId)"
        ),
        fromBlock: "latest",
        toBlock: "latest",
      });

      const formattedEvents: GuestbookEvent[] = logs.map((log) => ({
        guestId: log.args?.guestId ?? 0n,
        guest: log.args?.guest as `0x${string}`,
        message: log.args?.message || "",
        timestamp: log.args?.timestamp ?? 0n,
        tokenId: log.args?.tokenId ?? 0n,
        blockNumber: log.blockNumber ?? 0n,
        transactionHash: log.transactionHash,
      }));

      if (formattedEvents.length > 0) {
        setEvents((prev) => {
          const existingEventsMap = new Map(
            prev.map((event) => [`${event.guestId.toString()}-${event.guest}-${event.timestamp.toString()}`, event])
          );

          formattedEvents.forEach((event) => {
            const key = `${event.guestId.toString()}-${event.guest}-${event.timestamp.toString()}`;
            existingEventsMap.set(key, event);
          });

          const updatedEvents = Array.from(existingEventsMap.values());
          return updatedEvents.sort((a, b) => Number(b.timestamp - a.timestamp));
        });
      }
    } catch (err) {
      console.error("Error fetching latest events:", err);
    }
  };

  // Handle successful transactions
  useEffect(() => {
    if (isGmSuccess || isCustomSuccess) {
      // Clear any existing errors
      setError(null);
      // Reset form state
      setCustomMessage("gm");
      setMintNFT(false);
      // Fetch latest events immediately
      fetchLatestEvents();
    }
  }, [isGmSuccess, isCustomSuccess]);

  // Watch for new events
  useWatchContractEvent({
    address: contractAddress,
    abi: guestbookABI,
    eventName: "GuestbookSigned",
    chainId: baseSepolia.id,
    poll: true,
    pollingInterval: 2_000,
    batch: false,
    onLogs: (logs) => {
      const newEvents = logs
        .filter(
          (log) =>
            log.args.guestId != null &&
            log.args.guest != null &&
            log.args.message != null &&
            log.args.timestamp != null &&
            log.args.tokenId != null
        )
        .map((log) => ({
          guestId: log.args.guestId,
          guest: log.args.guest,
          message: log.args.message,
          timestamp: log.args.timestamp,
          tokenId: log.args.tokenId,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        })) as GuestbookEvent[];

      if (newEvents.length === 0) return;

      setEvents((prev) => {
        const existingEventsMap = new Map(
          prev.map((event) => [`${event.guestId.toString()}-${event.guest}-${event.timestamp.toString()}`, event])
        );

        newEvents.forEach((event) => {
          const key = `${event.guestId.toString()}-${event.guest}-${event.timestamp.toString()}`;
          existingEventsMap.set(key, event);
        });

        const updatedEvents = Array.from(existingEventsMap.values());
        return updatedEvents.sort((a, b) => Number(b.timestamp - a.timestamp));
      });
    },
    onError: (error) => {
      console.error("Error watching events:", error);
      if (chain?.id !== baseSepolia.id) {
        setError("Please connect to Base Sepolia network to watch events.");
      } else {
        setError("Failed to watch for new signatures. Please refresh the page.");
      }
    },
  });

  // Initial event fetch
  useEffect(() => {
    if (!publicClient) return;

    const fetchEvents = async () => {
      try {
        setIsLoadingEvents(true);
        const logs = await publicClient.getLogs({
          address: contractAddress,
          event: parseAbiItem(
            "event GuestbookSigned(uint256 indexed guestId, address indexed guest, string message, uint256 timestamp, uint256 tokenId)"
          ),
          fromBlock: 22079841n,
          toBlock: "latest",
        });

        console.log(logs);
        const formattedEvents: GuestbookEvent[] = logs.map((log) => ({
          guestId: log.args?.guestId ?? 0n,
          guest: log.args?.guest as `0x${string}`,
          message: log.args?.message || "",
          timestamp: log.args?.timestamp ?? 0n,
          tokenId: log.args?.tokenId ?? 0n,
          blockNumber: log.blockNumber ?? 0n,
          transactionHash: log.transactionHash,
        }));

        setEvents(formattedEvents.sort((a, b) => Number(b.timestamp - a.timestamp)));
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Failed to load signatures. Please try refreshing the page.");
      } finally {
        setIsLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [publicClient]);

  return (
    <div className={styles.guestbookContainer}>
      <section className={styles.section}>
        <p>
          Sign the guestbook on Base (free) or leave a message (0.00111 Ξ), mint it if you want (0.00111 Ξ). Don't be a
          jerk — harmful content will be moderated. Onchain gas fees still apply. I like{" "}
          <a href='https://rainbow.me/'>Rainbow</a>.
        </p>

        <ConnectButton
          chainStatus='name'
          showBalance={false}
          accountStatus={{
            smallScreen: "avatar",
            largeScreen: "full",
          }}
        />

        {isConnected && (
          <>
            {isWrongNetwork && (
              <div className={styles.error}>Please connect to Base Sepolia network to interact with the guestbook</div>
            )}

            <div className={styles.messageInput}>
              <div className={styles.messageTypeSelector}>
                <label className={`${styles.messageType} ${customMessage.toLowerCase() === "gm" ? styles.active : ""}`}>
                  <input
                    type='radio'
                    checked={customMessage.toLowerCase() === "gm"}
                    onChange={() => {
                      setCustomMessage("gm");
                      setError(null);
                    }}
                    disabled={isLoading}
                  />
                  Just say "gm"
                </label>
                <label className={`${styles.messageType} ${customMessage.toLowerCase() !== "gm" ? styles.active : ""}`}>
                  <input
                    type='radio'
                    checked={customMessage.toLowerCase() !== "gm"}
                    onChange={() => {
                      setCustomMessage("");
                      setError(null);
                    }}
                    disabled={isLoading}
                  />
                  Write a custom message
                </label>
              </div>

              {customMessage.toLowerCase() !== "gm" && (
                <div className={styles.flexCol}>
                  <textarea
                    value={customMessage}
                    onChange={(e) => {
                      const sanitized = sanitizeMessage(e.target.value);
                      setCustomMessage(sanitized);
                      setError(null);
                    }}
                    placeholder='Your message (max 140 characters)'
                    maxLength={140}
                    disabled={isLoading}
                    className={styles.input}
                    rows={3}
                  />
                  <span className={customMessage.length > 140 ? styles.error : ""}>
                    {140 - customMessage.length} characters remaining
                  </span>
                </div>
              )}
            </div>

            <label className={styles.nftOption}>
              <input
                type='checkbox'
                checked={mintNFT}
                onChange={(e) => setMintNFT(e.target.checked)}
                disabled={isLoading}
              />
              <span>Mint onchain (+0.00111 Ξ)</span>
            </label>

            <div className={styles.flexCol}>
              <div className={styles.priceBreakdown}>
                <span>Message fee:</span>
                <span>{customMessage.toLowerCase() === "gm" ? "No contract fee" : "0.00111 Ξ"}</span>
              </div>
              {mintNFT && (
                <div className={styles.priceBreakdown}>
                  <span>NFT fee:</span>
                  <span>0.00111 Ξ</span>
                </div>
              )}
              <div className={`${styles.priceBreakdown} ${styles.total}`}>
                <span>Total contract fees:</span>
                <span>
                  {customMessage.toLowerCase() === "gm" ? (mintNFT ? "0.00111" : "0") : mintNFT ? "0.00222" : "0.00111"}{" "}
                  Ξ
                </span>
              </div>
              <div className={styles.priceBreakdown}>
                <span>Gas fees:</span>
                <span>Variable (paid to network)</span>
              </div>
            </div>

            <div className={styles.actionButtons}>
              <button
                onClick={customMessage.toLowerCase() === "gm" ? signGuestbookGm : signGuestbookCustom}
                disabled={
                  isLoading ||
                  isWrongNetwork ||
                  Boolean(isPaused) ||
                  (customMessage.toLowerCase() !== "gm" && (!customMessage.trim() || customMessage.length > 140))
                }
                className={styles.button}
              >
                {isLoading ? "Signing..." : "Sign Guestbook"}
              </button>
            </div>

            {error && <div className={styles.error}>{error}</div>}
            {(isGmSuccess || isCustomSuccess) && (
              <div className={styles.success}>
                Successfully signed the guestbook!
                {mintNFT && " Your NFT is being minted."}
              </div>
            )}
          </>
        )}
      </section>

      <section className={styles.section}>
        {isLoadingEvents ? (
          <p>Loading previous signatures...</p>
        ) : events.length === 0 ? (
          <p>No signatures yet. Be the first to sign!</p>
        ) : (
          events.map((event) => (
            <article key={`${event.guestId}-${event.timestamp}`} className={styles.guestEntry}>
              <div className={styles.flexBetween}>
                <small>
                  {new Date(Number(event.timestamp * 1000n)).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </small>

                <small>
                  <a
                    href={`https://sepolia.basescan.org/block/${event.blockNumber.toString()}`}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    Block #{event.blockNumber.toString()}
                  </a>
                </small>
              </div>
              <div className={styles.flexCol}>
                <p className={styles.author}>
                  by <AddressDisplay address={event.guest} />
                </p>
                <p>{event.message || "gm"}</p>
              </div>
              <div className={styles.flexBetween}>
                <small>
                  <a
                    href={`https://sepolia.basescan.org/tx/${event.transactionHash}`}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    View on BaseScan
                  </a>
                </small>
                {event.tokenId > 0n && (
                  <small>
                    <a
                      href={`https://testnets.opensea.io/assets/base_sepolia/${contractAddress}/${event.tokenId.toString()}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className={styles.nftLink}
                    >
                      NFT #{event.tokenId.toString()}
                    </a>
                  </small>
                )}
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
};

interface AddressDisplayProps {
  address: `0x${string}`;
}

const AddressDisplay: React.FC<AddressDisplayProps> = ({ address }) => {
  const { data: ensName, isLoading } = useEnsName({
    address,
    chainId: 1, // Use mainnet for ENS resolution
  });

  if (isLoading) {
    return <span className={styles.addressLink}>{address}</span>;
  }

  return (
    <a
      href={`https://sepolia.basescan.org/address/${address}`}
      target='_blank'
      rel='noopener noreferrer'
      className={styles.addressLink}
    >
      {ensName || address}
    </a>
  );
};

const GuestbookEvents: React.FC = () => {
  return (
    <WagmiProvider>
      <GuestbookContent />
    </WagmiProvider>
  );
};

export default GuestbookEvents;
