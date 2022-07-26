// Guestbook
// Language: typescript

// A web3 guestbook.

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { useAccount } from 'wagmi';

import Guestlist from '@/_components/guestbook/guestlist';
import Mint from '@/_components/guestbook/mint';
import Notes from '@/_components/guestbook/notes';
import Text from '@/_components/text';

// components

export default function Home() {
  const contract = process.env.NEXT_PUBLIC_TARGET_CONTRACT_ADDRESS;
  const { address } = useAccount();

  return (
    <>
      <Text as="p" kind="p" font="mono">
        ▀█▀ █░█ █▀▀
        <br />
        ░█░ █▀█ ██▄
      </Text>
      <Text as="p" kind="p" font="mono">
        █▀▀ █░█ █▀▀ █▀ ▀█▀ █▄▄ █▀█ █▀█ █▄▀
        <br />
        █▄█ █▄█ ██▄ ▄█ ░█░ █▄█ █▄█ █▄█ █░█
      </Text>
      <Text as="p" kind="p" font="mono">
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
      <Text as="h4" kind="p" font="mono">
        Drop a GM, WAGMI, GN, etc below.
      </Text>
      <Notes />

      <ConnectButton
        chainStatus={{ smallScreen: `full`, largeScreen: `full` }}
        showBalance={false}
      />
      {address && <Mint />}
      <Guestlist />
    </>
  );
}

export const getStaticProps = async () => {
  return {
    props: {
      pageTitle: `The Guestbook`,
    },
  };
};
