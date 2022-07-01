// Guestbook
// Language: typescript

// A web3 guestbook.

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { useAccount } from 'wagmi';

import Guestlist from '@/components/Guestbook/Guestlist';
import Mint from '@/components/Guestbook/Mint';
import Notes from '@/components/Guestbook/Notes';
import Layout from '@/components/Layout';
import Text from '@/components/Text';
import Web3Provider from '@/utils/web3Provider';

// components

export default function Home() {
  const contract = process.env.NEXT_PUBLIC_TARGET_CONTRACT_ADDRESS;
  const { address, isConnecting, isDisconnected } = useAccount();

  return (
    <Layout as="main" layout="pageContent">
      <Text as="h1" kind="mono">
        ▀█▀ █░█ █▀▀
        <br />
        ░█░ █▀█ ██▄
      </Text>
      <Text as="h1" kind="mono">
        █▀▀ █░█ █▀▀ █▀ ▀█▀ █▄▄ █▀█ █▀█ █▄▀
        <br />
        █▄█ █▄█ ██▄ ▄█ ░█░ █▄█ █▄█ █▄█ █░█
      </Text>
      <Text as="p" kind="mono">
        <Text as="small" kind="small">
          <Link
            href={`${process.env.NEXT_PUBLIC_ETHERSCAN_URL}address/${contract}`}
            passHref
          >
            <a>optimistic-etherscan</a>
          </Link>
          {` | `}
          <Link
            href={`${process.env.NEXT_PUBLIC_QUIXOTIC_URL}collection/${contract}`}
            passHref
          >
            <a>quixotic</a>
          </Link>
        </Text>
      </Text>
      <Text as="h1" kind="mono">
        Drop a GM, WAGMI, GN, etc below.
      </Text>
      <Notes />

      <ConnectButton
        chainStatus={{ smallScreen: `full`, largeScreen: `full` }}
        showBalance={false}
      />
      {address && <Mint />}
      <Guestlist />
    </Layout>
  );
}

export const getStaticProps = async () => {
  return {
    props: {
      pageTitle: `The Guestbook`,
    },
  };
};
