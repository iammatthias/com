export const analyticsABI = [
  // Write functions
  {
    inputs: [
      {
        internalType: "string",
        name: "eventName",
        type: "string",
      },
      {
        internalType: "string",
        name: "properties",
        type: "string",
      },
      {
        internalType: "bytes32",
        name: "sessionId",
        type: "bytes32",
      },
    ],
    name: "addEvent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "pagePath",
        type: "string",
      },
      {
        internalType: "bytes32",
        name: "sessionId",
        type: "bytes32",
      },
    ],
    name: "addPageView",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "sessionId",
        type: "bytes32",
      },
    ],
    name: "createSession",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // Read functions
  {
    inputs: [],
    name: "getAllEventsData",
    outputs: [
      {
        internalType: "string[]",
        name: "",
        type: "string[]",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "count",
            type: "uint256",
          },
          {
            components: [
              {
                internalType: "string",
                name: "properties",
                type: "string",
              },
              {
                internalType: "uint256",
                name: "blockNumber",
                type: "uint256",
              },
            ],
            internalType: "struct OptimizedAnalytics.EventData[]",
            name: "events",
            type: "tuple[]",
          },
        ],
        internalType: "struct OptimizedAnalytics.EventGroup[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllPageViewCounts",
    outputs: [
      {
        internalType: "string[]",
        name: "",
        type: "string[]",
      },
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllSessions",
    outputs: [
      {
        internalType: "bytes32[]",
        name: "",
        type: "bytes32[]",
      },
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
      {
        internalType: "string[][]",
        name: "",
        type: "string[][]",
      },
      {
        internalType: "string[][]",
        name: "",
        type: "string[][]",
      },
      {
        internalType: "string[][]",
        name: "",
        type: "string[][]",
      },
      {
        internalType: "uint256[][]",
        name: "",
        type: "uint256[][]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "eventName",
        type: "string",
      },
    ],
    name: "getEventCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "pagePath",
        type: "string",
      },
    ],
    name: "getPageViewCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "sessionId",
        type: "bytes32",
      },
    ],
    name: "getSession",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "string[]",
        name: "",
        type: "string[]",
      },
      {
        internalType: "string[]",
        name: "",
        type: "string[]",
      },
      {
        internalType: "string[]",
        name: "",
        type: "string[]",
      },
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getSessionCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "sessionId",
        type: "bytes32",
      },
    ],
    name: "getSessionEvents",
    outputs: [
      {
        internalType: "string[]",
        name: "",
        type: "string[]",
      },
      {
        internalType: "string[]",
        name: "",
        type: "string[]",
      },
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];
