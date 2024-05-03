export const sessionExistsABI = [
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "sessionId",
        type: "bytes32",
      },
    ],
    name: "sessionExists",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export const getSessionABI = [
  {
    inputs: [{ internalType: "bytes32", name: "sessionId", type: "bytes32" }],
    name: "getSession",
    outputs: [
      { internalType: "bytes32", name: "", type: "bytes32" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "string[]", name: "", type: "string[]" },
      { internalType: "string[]", name: "", type: "string[]" },
      { internalType: "string[]", name: "", type: "string[]" },
      { internalType: "uint256[]", name: "", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export const getAllEventsDataABI = [
  {
    inputs: [],
    name: "getAllEventsData",
    outputs: [
      { internalType: "string[]", name: "", type: "string[]" },
      {
        components: [
          { internalType: "uint256", name: "count", type: "uint256" },
          {
            components: [
              { internalType: "string", name: "properties", type: "string" },
              { internalType: "uint256", name: "blockNumber", type: "uint256" },
            ],
            internalType: "struct Analytics.EventData[]",
            name: "events",
            type: "tuple[]",
          },
        ],
        internalType: "struct Analytics.EventGroup[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export const getAllPageViewCountsABI = [
  {
    inputs: [],
    name: "getAllPageViewCounts",
    outputs: [
      { internalType: "string[]", name: "", type: "string[]" },
      { internalType: "uint256[]", name: "", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export const getAllSessionsABI = [
  {
    inputs: [],
    name: "getAllSessions",
    outputs: [
      { internalType: "bytes32[]", name: "", type: "bytes32[]" },
      { internalType: "uint256[]", name: "", type: "uint256[]" },
      { internalType: "string[][]", name: "", type: "string[][]" },
      { internalType: "string[][]", name: "", type: "string[][]" },
      { internalType: "string[][]", name: "", type: "string[][]" },
      { internalType: "uint256[][]", name: "", type: "uint256[][]" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export const getEventCountABI = [
  {
    inputs: [{ internalType: "string", name: "eventName", type: "string" }],
    name: "getEventCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

export const getPageViewCountABI = [
  {
    inputs: [{ internalType: "string", name: "pagePath", type: "string" }],
    name: "getPageViewCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

export const getSessionCountABI = [
  {
    inputs: [],
    name: "getSessionCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

export const getSessionEventsABI = [
  {
    inputs: [{ internalType: "bytes32", name: "sessionId", type: "bytes32" }],
    name: "getSessionEvents",
    outputs: [
      { internalType: "string[]", name: "", type: "string[]" },
      { internalType: "string[]", name: "", type: "string[]" },
      { internalType: "uint256[]", name: "", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
];
