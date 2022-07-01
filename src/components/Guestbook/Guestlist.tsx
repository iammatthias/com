// Guestlist
// Language: typescript

// Everyone who has signed the guestbook

import { BigNumber } from 'ethers';
import Link from 'next/link';
import { useContractRead } from 'wagmi';

import Box from '@/components/Box';
import Squiggle from '@/components/etc/Squiggle';
import Text from '@/components/Text';
import abi from '@/utils/contract/abi.json';

import GuestENS from './ENS';
import { guestbookRecipe } from './Guestbook.css';

export default function Guestlist() {
  const contract = process.env.NEXT_PUBLIC_TARGET_CONTRACT_ADDRESS;

  const { data: allGuests, isLoading } = useContractRead({
    addressOrName: contract,
    contractInterface: abi.abi,
    functionName: `getAllGuests`,
    cacheOnBlock: true,
    chainId: 10,
  } as any);

  return (
    <>
      {isLoading
        ? null
        : allGuests &&
          allGuests
            .slice()
            .reverse()
            .map((guest) => (
              <Box
                key={guest}
                className={guestbookRecipe({ guestbook: `guestlistItem` })}
              >
                <Squiggle squiggleWidth={8} height={24} />
                <Box
                  className={guestbookRecipe({ guestbook: `guestlistMeta` })}
                >
                  <Text as="p" kind="mono">
                    <Text as="small" kind="small">
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
                    </Text>
                  </Text>
                  <Text as="p" kind="mono">
                    <Text as="small" kind="small">
                      Guest # {BigNumber.from(guest[0]._hex).toNumber() + 1} at
                      {` `}
                      <i>{guest[3]}</i>
                    </Text>
                  </Text>
                </Box>

                <Text as="p" kind="mono">
                  {guest[2]}
                </Text>

                {guest[4] == `true` && (
                  <Text as="p" kind="mono">
                    <Text as="small" kind="small">
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
                    </Text>
                  </Text>
                )}
              </Box>
            ))}
    </>
  );
}
