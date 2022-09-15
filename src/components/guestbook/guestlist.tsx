// Guestlist
// Language: typescript

// Everyone who has signed the guestbook

import { BigNumber } from 'ethers';
import Link from '@/components/link';
import { useContractRead } from 'wagmi';

import Box from '@/components/box';
import Squiggle from '@/components/squiggle';
import Text from '@/components/text';
import abi from '@/utils/contract/abi.json';

import GuestENS from './ens';
import { guestbookRecipe } from './guestbook.css';

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
                <Squiggle />
                <Box
                  className={guestbookRecipe({ guestbook: `guestlistMeta` })}
                >
                  <Text as="p" kind="xsmall" font="typewriter">
                    <Link
                      href={
                        process.env.NEXT_PUBLIC_ETHERSCAN_URL +
                        `address/` +
                        guest[1]
                      }
                    >
                      <GuestENS address={guest[1]} />
                    </Link>
                  </Text>
                  <Text as="p" kind="xsmall" font="typewriter">
                    Guest # {BigNumber.from(guest[0]._hex).toNumber() + 1} at
                    {` `}
                    {guest[3]}
                  </Text>
                </Box>

                <Text as="p" kind="p" font="typewriter">
                  {guest[2]}
                </Text>

                {guest[4] == `true` && (
                  <Text as="p" kind="xsmall" font="typewriter">
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
                )}
              </Box>
            ))}
    </>
  );
}
