import { Box } from '@/components/primitives/box';
import { GuestbookText } from './guestbookText';
import GuestENS from './guestEns';
import Squiggle from '../squiggle';
import Link from 'next/link';

import { useContractRead } from 'wagmi';
import abi from '@/lib/contract/abi.json';

import { BigNumber } from 'ethers';

export default function Guestlist() {
  const contract = process.env.NEXT_PUBLIC_TARGET_CONTRACT_ADDRESS;

  const { data: allGuests, isLoading } = useContractRead(
    {
      addressOrName: contract,
      contractInterface: abi.abi,
    } as any,
    `getAllGuests`,
    {
      cacheOnBlock: true,
      chainId: 10,
    },
  );

  return (
    <Box className="guests">
      {isLoading
        ? null
        : allGuests &&
          allGuests
            .slice()
            .reverse()
            .map((guest) => (
              <Box key={guest} css={{ width: `100%`, margin: `16px 0` }}>
                <Squiggle squiggleWidth="8" height="24" />
                <Box
                  css={{
                    display: `flex`,
                    alignContent: `center`,
                    justifyContent: `space-between`,
                  }}
                >
                  <GuestbookText
                    as="p"
                    css={{ margin: `8px 0`, wordBreak: `break-word` }}
                  >
                    <GuestbookText as="small">
                      <Link
                        href={
                          process.env.NEXT_PUBLIC_ETHERSCAN_URL +
                          `address/` +
                          guest[2]
                        }
                        passHref
                      >
                        <a>
                          <GuestENS address={guest[1]} />
                        </a>
                      </Link>
                    </GuestbookText>
                  </GuestbookText>
                  <GuestbookText as="p" css={{ margin: `8px 0` }}>
                    <GuestbookText as="small">
                      Guest # {BigNumber.from(guest[0]._hex).toNumber() + 1} at
                      {` `}
                      <i>{guest[3]}</i>
                    </GuestbookText>
                  </GuestbookText>
                </Box>
                <GuestbookText as="p" css={{ margin: `8px 0 16px` }}>
                  {guest[2]}
                </GuestbookText>

                {guest[4] == `true` && (
                  <GuestbookText as="p" css={{ margin: `8px 0` }}>
                    <GuestbookText as="small">
                      View NFT on{` `}
                      <Link
                        href={`${
                          process.env.NEXT_PUBLIC_QUIXOTIC_URL
                        }asset/${contract}/${BigNumber.from(
                          guest[5]._hex,
                        ).toNumber()}`}
                      >
                        quixotic
                      </Link>
                    </GuestbookText>
                  </GuestbookText>
                )}
              </Box>
            ))}
    </Box>
  );
}
