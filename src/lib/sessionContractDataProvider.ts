import { publicClient } from "@lib/viemProvider";

// Contract address
const CONTRACT_ADDRESS = import.meta.env.PUBLIC_ANALYTICS_CONTRACT as `0x${string}`;

// Get session details
export async function getSession(sessionId: `0x${string}`) {
  const abi = [
    {
      inputs: [{ internalType: "bytes32", name: "sessionId", type: "bytes32" }],
      name: "getSession",
      outputs: [
        { internalType: "uint64", name: "timestamp", type: "uint64" },
        {
          internalType: "struct Analytics.PageView[]",
          name: "pageViews",
          type: "tuple[]",
        },
        {
          internalType: "struct Analytics.Event[]",
          name: "events",
          type: "tuple[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ];

  const data = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: "getSession",
    args: [sessionId],
  });

  return data;
}

// Get all session IDs
export async function getAllSessionIds() {
  const abi = [
    {
      inputs: [],
      name: "getAllSessionIds",
      outputs: [{ internalType: "bytes32[]", name: "", type: "bytes32[]" }],
      stateMutability: "view",
      type: "function",
    },
  ];

  const data = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: "getAllSessionIds",
  });

  return data;
}

// Get session count
export async function getSessionCount() {
  const abi = [
    {
      inputs: [],
      name: "getSessionCount",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
  ];

  const data = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: "getSessionCount",
  });

  return data;
}

// Get page view count
export async function getPageViewCount(pagePath: string) {
  const abi = [
    {
      inputs: [{ internalType: "string", name: "pagePath", type: "string" }],
      name: "getPageViewCount",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
  ];

  const data = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: "getPageViewCount",
    args: [pagePath],
  });

  return data;
}

// Get event count
export async function getEventCount(eventName: string) {
  const abi = [
    {
      inputs: [{ internalType: "string", name: "eventName", type: "string" }],
      name: "getEventCount",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
  ];

  const data = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: "getEventCount",
    args: [eventName],
  });

  return data;
}

// Get all events
export async function getAllEvents() {
  const abi = [
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
  ];

  const data = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: "getAllEvents",
  });

  return data;
}

// Get all page views
export async function getAllPageViews() {
  const abi = [
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
  ];

  const data = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: "getAllPageViews",
  });

  return data;
}

// Get session IDs within a range
export async function getSessionIds(start: number, end: number) {
  const abi = [
    {
      inputs: [
        { internalType: "uint256", name: "start", type: "uint256" },
        { internalType: "uint256", name: "end", type: "uint256" },
      ],
      name: "getSessionIds",
      outputs: [{ internalType: "bytes32[]", name: "", type: "bytes32[]" }],
      stateMutability: "view",
      type: "function",
    },
  ];

  const data = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: "getSessionIds",
    args: [start, end],
  });

  return data;
}

// Get events within a range
export async function getEventsInRange(start: number, end: number) {
  const abi = [
    {
      inputs: [
        { internalType: "uint256", name: "start", type: "uint256" },
        { internalType: "uint256", name: "end", type: "uint256" },
      ],
      name: "getEvents",
      outputs: [
        { internalType: "string[]", name: "", type: "string[]" },
        { internalType: "uint256[]", name: "", type: "uint256[]" },
        { internalType: "uint64[]", name: "", type: "uint64[]" },
      ],
      stateMutability: "view",
      type: "function",
    },
  ];

  const data = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: "getEvents",
    args: [start, end],
  });

  return data;
}

// Get page views within a range
export async function getPageViewsInRange(start: number, end: number) {
  const abi = [
    {
      inputs: [
        { internalType: "uint256", name: "start", type: "uint256" },
        { internalType: "uint256", name: "end", type: "uint256" },
      ],
      name: "getPageViews",
      outputs: [
        { internalType: "string[]", name: "", type: "string[]" },
        { internalType: "uint256[]", name: "", type: "uint256[]" },
        { internalType: "uint64[]", name: "", type: "uint64[]" },
      ],
      stateMutability: "view",
      type: "function",
    },
  ];

  const data = await publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: "getPageViews",
    args: [start, end],
  });

  return data;
}
