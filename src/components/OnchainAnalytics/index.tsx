import { useEffect, useState } from "react";
import { baseSepoliaClient } from "@lib/viemProvider";
import "./OnchainAnalytics.css";

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

interface OnchainAnalyticsProps {
  contractAddress: `0x${string}`;
}

export default function OnchainAnalytics({ contractAddress }: OnchainAnalyticsProps) {
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [sessionCount, setSessionCount] = useState<bigint>(0n);
  const [sessionIds, setSessionIds] = useState<`0x${string}`[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const [count, views, eventsData, ids] = await Promise.all([
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
          const [pagePathsRaw, pageOccurrencesRaw] = views as readonly [readonly string[], readonly bigint[], unknown];
          const pagePaths = [...pagePathsRaw];
          const pageOccurrences = [...(pageOccurrencesRaw as readonly bigint[])].map(Number);
          if (Array.isArray(pagePaths) && Array.isArray(pageOccurrences)) {
            setPageViews(
              pagePaths
                .map((page, i) => ({
                  page,
                  views: pageOccurrences[i],
                }))
                .filter(({ page }) => page !== "/test" && page !== "/posts/1546329600000-markdown-test")
                .sort((a, b) => b.views - a.views)
                .slice(0, 5)
            );
          }
        }

        // Process events
        if (Array.isArray(eventsData) && eventsData.length === 3) {
          const [eventNamesRaw, eventOccurrencesRaw] = eventsData as readonly [
            readonly string[],
            readonly bigint[],
            unknown,
          ];
          const eventNames = [...eventNamesRaw];
          const eventOccurrences = [...(eventOccurrencesRaw as readonly bigint[])].map(Number);
          if (Array.isArray(eventNames) && Array.isArray(eventOccurrences)) {
            setEvents(
              eventNames
                .map((event, i) => ({
                  event,
                  count: eventOccurrences[i],
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 3)
            );
          }
        }

        setSessionIds(ids as `0x${string}`[]);
      } catch (error) {
        setErrorMsg("Error fetching analytics data: " + (error instanceof Error ? error.message : String(error)));
        console.error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, [contractAddress]);

  if (isLoading) {
    return (
      <div className='onchain-analytics-container'>
        <div className='onchain-analytics-loading'>Loading analytics data...</div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className='onchain-analytics-container'>
        <div className='onchain-analytics-error'>{errorMsg}</div>
      </div>
    );
  }

  return (
    <div className='onchain-analytics-container'>
      <p>
        <span id='sessionCount'>{sessionCount.toString()}</span> unique sessions have been recorded.
      </p>

      <table className='onchain-analytics-table'>
        <thead>
          <tr>
            <th>Top 5 pages</th>
            <th>Views</th>
          </tr>
        </thead>
        <tbody>
          {pageViews.map((view, index) => (
            <tr key={index}>
              <td className='onchain-analytics-break'>{view.page}</td>
              <td>{view.views}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className='onchain-analytics-table'>
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
        The keccack256 hashes generated are technically valid private keys. These private keys are effectively burned,
        since they are public. As such, they should never be used for anything.
      </p>
      <p>Click on a hash to view its corresponding portrait:</p>
      <div className='onchain-analytics-session-hashes'>
        {sessionIds.map((sessionId, index) => (
          <a
            key={index}
            href={`/onchain-analytics/${sessionId}`}
            className='onchain-analytics-session-hash onchain-analytics-break'
          >
            {sessionId}
          </a>
        ))}
      </div>
    </div>
  );
}
