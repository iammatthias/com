"use client";

import isConnected from "@/lib/helpers/isConnected";

export default function EntryWrapper(walletGated: any, children: any) {
  const wallet = isConnected();

  const showWalletGated = wallet ? true : walletGated;
  return showWalletGated ? children : null;
}
