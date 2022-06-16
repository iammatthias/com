import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Sparkle from '../sparkle';

import { GuestbookText } from './guestbookText';
import Guestlist from './guestlist';
import Mint from './mint';
import Notes from './notes';

// page header

export default function Base() {
  const contract = process.env.NEXT_PUBLIC_TARGET_CONTRACT_ADDRESS;

  const { data: accountData } = useAccount();
  return (
    <>
      <GuestbookText>GM, WAGMI, GN.</GuestbookText>
      <GuestbookText>Sign the web3 guestbook!</GuestbookText>
      <Notes>
        <GuestbookText as="ol">
          <GuestbookText as="li">
            Signing the guestbook is free, but gas fees will apply.
          </GuestbookText>
          <GuestbookText as="li">
            Minting the NFT is optional, and costs 0.01 Ξ.
          </GuestbookText>
          <GuestbookText as="li">
            Minting will issue a unique NFT customized with colors derived from
            your ETH address.
          </GuestbookText>
          <GuestbookText as="li">
            There is a 280 character limit for guestlist messages.
          </GuestbookText>
          <GuestbookText as="li">
            An admin function exists for content moderation. In the case of
            inflammatory, hateful, or otherwise inappropriate content, the
            message can be replaced with &quot;gm&quot; (or something similar).
            <br />
            <br />
            This is not an act that would happen lightly. This project is meant
            to be exist as a form of friendly engagement with the community.
            {` `}
            <Sparkle>Please be kind ✌️</Sparkle>
          </GuestbookText>
        </GuestbookText>
      </Notes>
      <GuestbookText>
        <GuestbookText as="small">
          <a
            href={`${process.env.NEXT_PUBLIC_ETHERSCAN_URL}address/${contract}`}
          >
            optimistic-etherscan
          </a>
          {` | `}
          <a
            href={`${process.env.NEXT_PUBLIC_QUIXOTIC_URL}collection/${contract}`}
          >
            quixotic
          </a>
        </GuestbookText>
      </GuestbookText>
      <ConnectButton
        accountStatus={{ smallScreen: `address`, largeScreen: `address` }}
        chainStatus={{ smallScreen: `name`, largeScreen: `name` }}
        showBalance={false}
      />
      {accountData && <Mint />}

      <Guestlist />
    </>
  );
}
