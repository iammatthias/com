"use client";

import React, { useState, useEffect } from "react";
import { getAccount, watchAccount } from "@wagmi/core";

interface IsConnectedProps {
  children: React.ReactNode;
  isWalletGated: boolean;
}

export default function IsConnected({
  children,
  isWalletGated,
}: IsConnectedProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unwatch: (() => void) | null = null;

    async function fetchAccount() {
      const account = await getAccount();
      setIsConnected(account.isConnected);
      setLoading(false);

      if (!unwatch) {
        unwatch = watchAccount((account) => {
          setIsConnected(account.isConnected);
        });
      }
    }

    fetchAccount();

    return () => {
      if (unwatch) {
        unwatch();
      }
    };
  }, []);

  if (loading) {
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
