import { useEffect, useState } from "react";
import { baseSepoliaClient } from "@/lib/viemProvider";
import styles from "./OnchainAnalytics.module.css";

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

export default function OnchainAnalytics({ contractAddress }: { contractAddress: `0x${string}` }) {
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [sessionCount, setSessionCount] = useState<bigint>(0n);
  const [sessionIds, setSessionIds] = useState<`0x${string}`[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [count, views, events, ids] = await Promise.all([
          baseSepoliaClient.readContract({
            address: contractAddress,
            abi: analyticsABI,
            functionName: "getSessionCount",
          }),
          baseSepoliaClient.readContract({
            address: contractAddress,
            abi: analyticsABI,
            functionName: "getAllPageViews",
          }),
          baseSepoliaClient.readContract({
            address: contractAddress,
            abi: analyticsABI,
            functionName: "getAllEvents",
          }),
          baseSepoliaClient.readContract({
            address: contractAddress,
            abi: analyticsABI,
            functionName: "getAllSessionIds",
          }),
        ]);

        setSessionCount(count as bigint);

        // Process page views
        if (Array.isArray(views) && views.length === 3) {
          const [pagePaths, pageOccurrences] = views;
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

        // Process events
        if (Array.isArray(events) && events.length === 3) {
          const [eventNames, eventOccurrences] = events;
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

        setSessionIds(ids as `0x${string}`[]);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  console.log("CONTRACT_ADDRESS", contractAddress);

  return (
    <div className={styles.container}>
      {isLoading ? (
        <div className={styles.loading}>Loading analytics data...</div>
      ) : (
        <>
          <p>
            <span id='sessionCount'>{sessionCount.toString()}</span> unique sessions have been recorded.
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
        </>
      )}
    </div>
  );
}
