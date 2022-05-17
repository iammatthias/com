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
      {!accountData && (
        <GuestbookText>
          Connect your wallet to sign the web3 guestbook.
        </GuestbookText>
      )}
      <GuestbookText>
        Write your message to the blockchain for a nominal gas fee.
      </GuestbookText>
      <GuestbookText>
        You can also choose to write your message on an NFT for 0.001 Ξ.
      </GuestbookText>
      <GuestbookText>
        This project is entirely on-chain. The metadata, and the SVG renderer
        exist on Optimism.
      </GuestbookText>
      <Notes>
        <GuestbookText as="ol" css={{ fontSize: `0.707rem` }}>
          <GuestbookText as="li">
            If you choose to write your message on an NFT, the background
            gradient will be generated using colors derived from your connected
            wallet, similar to <a href="https://eeethers.xyz">Eeethers</a>
            {` `}
            (another fun project on Optimism!).
          </GuestbookText>
          <GuestbookText as="li">
            If you choose to write your message on an NFT, there is a 1254
            character limit in order for it to fit on the NFT.
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
            etherscan
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
