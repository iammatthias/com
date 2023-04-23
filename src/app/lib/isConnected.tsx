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
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchAccount() {
      try {
        const account = await getAccount();
        setIsConnected(account.isConnected);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchAccount();
  }, []);

  useEffect(() => {
    if (!loading) {
      const unwatch = watchAccount((account) => {
        setIsConnected(account.isConnected);
      });

      // Cleanup function to unsubscribe from account changes when component unmounts
      return () => {
        unwatch();
      };
    }
  }, [loading]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
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
