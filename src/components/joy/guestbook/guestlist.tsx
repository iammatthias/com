import { Box } from '@/components/primitives/box';
import { GuestbookText } from './guestbookText';
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
                      <a>{guest[2]}</a>
                    </Link>
                  </GuestbookText>
                </GuestbookText>
                <GuestbookText as="p" css={{ margin: `8px 0` }}>
                  {guest[3]}
                </GuestbookText>
                <Box
                  css={{
                    display: `flex`,
                    alignContent: `center`,
                    justifyContent: `space-between`,
                  }}
                >
                  <GuestbookText as="p" css={{ margin: `8px 0` }}>
                    <GuestbookText as="small">
                      Guest # {BigNumber.from(guest[0]._hex).toNumber() + 1}
                    </GuestbookText>
                  </GuestbookText>
                  <GuestbookText as="p" css={{ margin: `8px 0` }}>
                    <GuestbookText as="small">
                      at{` `}
                      <i>{guest[4]}</i>
                    </GuestbookText>
                  </GuestbookText>
                </Box>
                {BigNumber.from(guest[0]._hex).toNumber() ==
                  BigNumber.from(guest[1]._hex).toNumber() ||
                BigNumber.from(guest[1]._hex).toNumber() > 0 ? (
                  <GuestbookText>
                    <GuestbookText as="small">
                      View on{` `}
                      <Link
                        href={`${
                          process.env.NEXT_PUBLIC_QUIXOTIC_URL
                        }asset/${contract}/${BigNumber.from(
                          guest[1]._hex,
                        ).toNumber()}`}
                      >
                        quixotic
                      </Link>
                    </GuestbookText>
                  </GuestbookText>
                ) : null}
              </Box>
            ))}
    </Box>
  );
}
