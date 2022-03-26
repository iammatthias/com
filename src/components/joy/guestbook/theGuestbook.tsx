import { Text } from '@/components/primitives/text';
import { useAccount } from 'wagmi';
import Account from './account';
import Connect from './connect';
import Guestlist from './guestlist';
import SignMessage from './signMessage';

// page header

export default function TheGuestbook() {
  const [{ data: accountData, loading, error }] = useAccount();
  return (
    <>
      {/* {accountData?.address ? <Account /> : <Connect />} */}
      {!accountData?.address && <Connect />}
      <Account />
      <Text as="p" css={{ margin: `0 0 16px` }}>
        Write a message on the blockchain. Get it on an NFT (if you want).
      </Text>
      {loading && <Text as="p">Loading...</Text>}
      {error && <Text as="p">{error?.message ?? `Failed to connect`}</Text>}
      {accountData && <SignMessage />}
      <Guestlist />
    </>
  );
}
