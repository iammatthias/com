import { useEffect, useState } from "react";
import { useReadContract } from "wagmi";
import WagmiProvider from "@/lib/WagmiProvider";
import styles from "./OnchainAnalytics.module.css";

const CONTRACT_ADDRESS = import.meta.env.PUBLIC_ANALYTICS_CONTRACT as `0x${string}`;

// ABI fragments for the analytics contract
const analyticsABI = [
  {
    inputs: [],
    name: "getAllSessionIds",
    outputs: [{ internalType: "bytes32[]", name: "", type: "bytes32[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getSessionCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllPageViews",
    outputs: [
      { internalType: "string[]", name: "", type: "string[]" },
      { internalType: "uint256[]", name: "", type: "uint256[]" },
      { internalType: "uint64[]", name: "", type: "uint64[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllEvents",
    outputs: [
      { internalType: "string[]", name: "", type: "string[]" },
      { internalType: "uint256[]", name: "", type: "uint256[]" },
      { internalType: "uint64[]", name: "", type: "uint64[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

interface PageView {
  page: string;
  views: number;
}

interface Event {
  event: string;
  count: number;
}

function AnalyticsContent() {
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Use Wagmi hooks for contract reads
  const { data: sessionCount, isLoading: isLoadingSessionCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: analyticsABI,
    functionName: "getSessionCount",
  });

  const { data: allPageViews, isLoading: isLoadingPageViews } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: analyticsABI,
    functionName: "getAllPageViews",
  });

  const { data: allEvents, isLoading: isLoadingEvents } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: analyticsABI,
    functionName: "getAllEvents",
  });

  const { data: sessionIds, isLoading: isLoadingSessionIds } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: analyticsABI,
    functionName: "getAllSessionIds",
  });

  const isLoading = isLoadingSessionCount || isLoadingPageViews || isLoadingEvents || isLoadingSessionIds;

  // Process page views data
  useEffect(() => {
    if (allPageViews && Array.isArray(allPageViews) && allPageViews.length === 3) {
      const [pagePaths, pageOccurrences] = allPageViews;
      if (Array.isArray(pagePaths) && Array.isArray(pageOccurrences)) {
        const processedPageViews = pagePaths
          .map((page, i) => ({
            page,
            views: Number(pageOccurrences[i]),
          }))
          .filter(({ page }) => page !== "/test" && page !== "/posts/1546329600000-markdown-test")
          .sort((a, b) => b.views - a.views)
          .slice(0, 5);
        setPageViews(processedPageViews);
      }
    }
  }, [allPageViews]);

  // Process events data
  useEffect(() => {
    if (allEvents && Array.isArray(allEvents) && allEvents.length === 3) {
      const [eventNames, eventOccurrences] = allEvents;
      if (Array.isArray(eventNames) && Array.isArray(eventOccurrences)) {
        const processedEvents = eventNames
          .map((event, i) => ({
            event,
            count: Number(eventOccurrences[i]),
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);
        setEvents(processedEvents);
      }
    }
  }, [allEvents]);

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.stats}>
        {isLoading ? (
          <div className={styles.loading}>Loading analytics data...</div>
        ) : (
          <>
            <p>
              <span id='sessionCount'>{sessionCount?.toString() || "0"}</span> unique sessions have been recorded.
            </p>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Top 5 pages</th>
                  <th>Views</th>
                </tr>
              </thead>
              <tbody>
                {pageViews.map((view, index) => (
                  <tr key={index}>
                    <td className={styles.break}>{view.page}</td>
                    <td>{view.views}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Top events</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, index) => (
                  <tr key={index}>
                    <td>{event.event}</td>
                    <td>{event.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div>
              <h4>Session Hashes</h4>
              <p>
                The keccack256 hashes generated are technically valid private keys. These private keys are effectively
                burned, since they are public. As such, they should never be used for anything.
              </p>
              <p>Click on a hash to view its corresponding portrait:</p>
              <div className={styles.sessionHashes}>
                {sessionIds?.map((sessionId, index) => (
                  <a
                    key={index}
                    href={`/onchain-analytics/${sessionId}`}
                    className={`${styles.sessionHash} ${styles.break}`}
                  >
                    {sessionId}
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function OnchainAnalytics() {
  return (
    <WagmiProvider>
      <AnalyticsContent />
    </WagmiProvider>
  );
}
