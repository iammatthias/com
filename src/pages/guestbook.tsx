// Guestbook
// Language: typescript

// A web3 guestbook.

import { ConnectKitButton } from 'connectkit';
import Link from '@/components/link';

import Guestlist from '@/components/guestbook/guestlist';
import Mint from '@/components/guestbook/mint';
import Notes from '@/components/guestbook/notes';
import Text from '@/components/text';
import Subgrid from '@/components/subGrid';
import Box from '@/components/box';

// components

export default function Guestbook() {
  const contract = process.env.NEXT_PUBLIC_TARGET_CONTRACT_ADDRESS;

  return (
    <Subgrid>
      <Text as="p" kind="guestbookHeader" font="mono">
        ▀█▀ █░█ █▀▀
        <br />
        ░█░ █▀█ ██▄
      </Text>
      <Text as="p" kind="guestbookHeader" font="mono">
        █▀▀ █░█ █▀▀ █▀ ▀█▀ █▄▄ █▀█ █▀█ █▄▀
        <br />
        █▄█ █▄█ ██▄ ▄█ ░█░ █▄█ █▄█ █▄█ █░█
      </Text>
      <Text as="p" kind="xsmall" font="typewriter">
        <Link
          href={`${process.env.NEXT_PUBLIC_ETHERSCAN_URL}address/${contract}`}
        >
          optimistic-etherscan
        </Link>
        {` | `}
        <Link
          href={`${process.env.NEXT_PUBLIC_QUIXOTIC_URL}collection/${contract}`}
        >
          quixotic
        </Link>
        {` | `}
        <Link href="https://github.com/iammatthias/.com/blob/main/src/utils/contract/solidity/TheGuestBook.sol">
          contract
        </Link>
      </Text>

      <Text as="h4" kind="p" font="mono">
        Drop a GM, WAGMI, GN, etc below.
      </Text>

      <Notes />

      <Box>
        <ConnectKitButton />
      </Box>
      <Mint />
      <Guestlist />
    </Subgrid>
  );
}

export const getStaticProps = async () => {
  return {
    props: {
      pageTitle: `The Guestbook`,
    },
  };
};
