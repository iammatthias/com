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

  if (isConnecting) {
    return <div>Loading...</div>;
  }

  if (isWalletGated) {
    if (isConnected) {
      return <>{children}</>;
    } else {
      return <></>;
    }
  } else {
    return <>{children}</>;
  }
}
