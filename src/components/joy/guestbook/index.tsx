import { Text } from '@/components/primitives/text';
import { Box } from '@/components/primitives/box';
import { useAccount } from 'wagmi';
import Account from './account';

import Guestlist from './guestlist';
import SignMessage from './signMessage';
import { ConnectButton } from '@rainbow-me/rainbowkit';

// page header

export default function TheGuestbook() {
  const [{ data: accountData, loading, error }] = useAccount();
  return (
    <>
      <Text as="h1" css={{ margin: `0 0 32px` }}>
        The Guest Book
      </Text>
      <Text as="p" css={{ margin: `0 0 16px` }}>
        Write a message on the blockchain. Get it on an NFT (if you want).
      </Text>
      {!accountData?.address && (
        <Text as="p" css={{ margin: `0 0 16px` }}>
          Connect your wallet to get started.
        </Text>
      )}
      <Account />
      {!accountData?.address && (
        <Box css={{ div: { width: `fit-content`, margin: `0 0 16px` } }}>
          <ConnectButton />
        </Box>
      )}

      {loading && <Text as="p">Loading...</Text>}
      {error && <Text as="p">{error?.message ?? `Failed to connect`}</Text>}
      {accountData && <SignMessage />}
      <Guestlist />
    </>
  );
}
