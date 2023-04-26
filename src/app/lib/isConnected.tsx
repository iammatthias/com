"use client";

import React, { useState, useEffect } from "react";
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
  const [clientIsConnected, setClientIsConnected] = useState(isConnected);

  useEffect(() => {
    setClientIsConnected(isConnected);
  }, [isConnected]);

  console.log(clientIsConnected);

  if (isConnecting) {
    return <div>Loading...</div>;
  }

  if (isWalletGated) {
    if (clientIsConnected) {
      return <>{children}</>;
    } else {
      return <></>;
    }
  } else {
    return <>{children}</>;
  }
}
