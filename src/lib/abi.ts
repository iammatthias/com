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
