/** @jsx jsx */
import { jsx } from 'theme-ui';
import React from 'react';
import { useMoralis } from 'react-moralis';
import WalletConnectProvider from '@walletconnect/web3-provider';

export function GuestbookAuth(props) {
  const { authenticate, isAuthenticated, user } = useMoralis();

  //  Create WalletConnect Provider
  const provider = new WalletConnectProvider({
    rpc: {
      1: process.env.GATSBY_MORALIS_NODE,
      4: process.env.GATSBY_MORALIS_NODE_RINKEBY,
    },
  });

  return {
    login: async () => {
      await provider.enable();
      try {
        await authenticate({
          provider: provider,
          onComplete: () => alert('🎉'),
        });
      } catch (e) {
        console.error(e.message, e);
      }
    },

    // guestbookLog: async () => {
    //   try {
    //     const guests = await Moralis.Cloud.run('getUserList', {});
    //     return guests;
    //   } catch (e) {
    //     console.error(e.message, e);
    //   }
    // },
  };
}
