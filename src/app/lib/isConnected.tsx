"use client";

import React from "react";
import { useAccount } from "wagmi";

interface IsConnectedProps {
  children: React.ReactNode;
  isWalletGated: boolean;
}

export default function IsConnected({
  children,
  isWalletGated,
}: IsConnectedProps) {
  const { isConnected, isConnecting } = useAccount();

  // If the item is not wallet-gated, always show content.
  if (!isWalletGated) {
    return <>{children}</>;
  }

  // If the item is wallet-gated, show content based on the account connection status.
  if (isConnecting) {
    return <div>Connecting...</div>;
  } else if (isConnected) {
    return <>{children}</>;
  } else {
    return <></>;
  }
}
