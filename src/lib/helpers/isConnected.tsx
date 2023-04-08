"use client";

import { useAccount } from "wagmi";

export default function useIsConnected() {
  const { address } = useAccount();

  return address ? true : false;
}
