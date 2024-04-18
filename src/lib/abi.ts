export const addPageViewABI = [
  {
    inputs: [
      {
        internalType: "string",
        name: "path",
        type: "string",
      },
      {
        internalType: "bytes32",
        name: "sessionHash",
        type: "bytes32",
      },
    ],
    name: "addPageView",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export const addSessionABI = [
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "sessionHash",
        type: "bytes32",
      },
    ],
    name: "addSession",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export const sessionCountABI = [
  {
    inputs: [],
    name: "sessionCount",
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
];

export const getAllPageViewsABI = [
  {
    inputs: [],
    name: "getAllPageViews",
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
];

export const getAllSessionHashesABI = [
  {
    inputs: [],
    name: "getAllSessionHashes",
    outputs: [
      {
        internalType: "bytes32[]",
        name: "",
        type: "bytes32[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export const sessionExistsABI = [
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "",
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
