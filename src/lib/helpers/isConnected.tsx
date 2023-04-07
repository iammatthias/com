"use client";

import { useAccount } from "wagmi";

export default function isConnected() {
  const { address } = useAccount();

  return address ? true : false;
}
