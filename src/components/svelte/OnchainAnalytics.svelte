<script lang="ts">
  import { onMount } from "svelte";
  import { baseSepoliaClient } from "@/lib/viemProvider";

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

  export let contractAddress: `0x${string}`;

  let pageViews: PageView[] = [];
  let events: Event[] = [];
  let sessionCount: bigint = 0n;
  let sessionIds: `0x${string}`[] = [];
  let isLoading = true;
  let errorMsg: string | null = null;

  onMount(async () => {
    isLoading = true;
    errorMsg = null;
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

      sessionCount = count as bigint;

      // Process page views
      if (Array.isArray(views) && views.length === 3) {
        const [pagePathsRaw, pageOccurrencesRaw] = views as readonly [readonly string[], readonly bigint[], unknown];
        const pagePaths = [...pagePathsRaw];
        const pageOccurrences = [...(pageOccurrencesRaw as readonly bigint[])].map(Number);
        if (Array.isArray(pagePaths) && Array.isArray(pageOccurrences)) {
          pageViews = pagePaths
            .map((page, i) => ({
              page,
              views: pageOccurrences[i],
            }))
            .filter(({ page }) => page !== "/test" && page !== "/posts/1546329600000-markdown-test")
            .sort((a, b) => b.views - a.views)
            .slice(0, 5);
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
          events = eventNames
            .map((event, i) => ({
              event,
              count: eventOccurrences[i],
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);
        }
      }

      sessionIds = ids as `0x${string}`[];
    } catch (error) {
      errorMsg = "Error fetching analytics data: " + (error instanceof Error ? error.message : String(error));
      console.error(errorMsg);
    } finally {
      isLoading = false;
    }
  });
</script>

<!-- Svelte markup, using Svelte's style system. Replace class names with Svelte's scoped classes below. -->
<div class="container">
  {#if isLoading}
    <div class="loading">Loading analytics data...</div>
  {:else if errorMsg}
    <div class="error">{errorMsg}</div>
  {:else}
    <p>
      <span id="sessionCount">{sessionCount.toString()}</span> unique sessions have been recorded.
    </p>

    <table class="table">
      <thead>
        <tr>
          <th>Top 5 pages</th>
          <th>Views</th>
        </tr>
      </thead>
      <tbody>
        {#each pageViews as view, index}
          <tr>
            <td class="break">{view.page}</td>
            <td>{view.views}</td>
          </tr>
        {/each}
      </tbody>
    </table>

    <table class="table">
      <thead>
        <tr>
          <th>Top events</th>
          <th>Count</th>
        </tr>
      </thead>
      <tbody>
        {#each events as event, index}
          <tr>
            <td>{event.event}</td>
            <td>{event.count}</td>
          </tr>
        {/each}
      </tbody>
    </table>

    <h4>Session Hashes</h4>
    <p>
      The keccack256 hashes generated are technically valid private keys. These private keys are effectively burned,
      since they are public. As such, they should never be used for anything.
    </p>
    <p>Click on a hash to view its corresponding portrait:</p>
    <div class="sessionHashes">
      {#each sessionIds as sessionId, index}
        <a href={`/onchain-analytics/${sessionId}`} class="sessionHash break">
          {sessionId}
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>
  /* Svelte scoped styles, adapted from the CSS module. Adjust as needed. */
  .container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .container > *:not(.sessionHashes) {
    max-width: 600px;
  }

  .loading {
    text-align: center;
    color: #888;
    font-size: 1.1rem;
  }
  .error {
    color: #c00;
    background: #fee;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
    text-align: center;
  }

  .break {
    word-break: break-all;
  }
  .sessionHashes {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  .sessionHash {
    font-family: monospace;
    font-size: 0.75rem;
    color: #333;
    transition: background 0.2s;
  }
  .sessionHash:hover {
    background: #e0e0e0;
  }
</style>
