"use client";

import React, { useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";

interface IsConnectedProps {
  children: React.ReactNode;
  isWalletGated: boolean;
}

export default function IsConnected({
  children,
  isWalletGated,
}: IsConnectedProps) {
  const { isConnected, isConnecting } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (!isConnecting) {
      router.refresh();
    }
  }, [isConnected, isConnecting, router]);

  if (!isWalletGated) {
    return <>{children}</>;
  }

  if (isConnecting) {
    return <></>;
  } else if (isConnected) {
    return <>{children}</>;
  } else {
    return <></>;
  }
}
