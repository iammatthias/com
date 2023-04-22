"use client";

import { getAccount } from "@wagmi/core";

export default async function IsConnected({
  children,
  isWalletGated,
}: {
  children: React.ReactNode;
  isWalletGated: boolean;
}) {
  const account = await getAccount();

  const { isConnected } = account;

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
