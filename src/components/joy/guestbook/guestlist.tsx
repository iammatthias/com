import { Box } from '@/components/primitives/box';
import { Text } from '@/components/primitives/text';
import Squiggle from '../squiggle';
import Link from 'next/link';

import { useContractRead, useProvider } from 'wagmi';
import { BigNumber } from 'ethers';
import abi from '@/lib/contract/abi.json';
import Ens from './ens';

export default function Guestlist() {
  const contractAddress = process.env.NEXT_PUBLIC_TARGET_CONTRACT_ADDRESS;

  const { data: allGuests, isLoading } = useContractRead(
    {
      addressOrName: contractAddress,
      contractInterface: abi.abi,
    } as any,
    `getAllGuests`,
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
              <Box key={guest} css={{ width: `fit-content`, margin: `32px 0` }}>
                <Squiggle />
                <Text as="p" css={{ margin: `8px 0`, wordBreak: `break-word` }}>
                  <Text as="small">
                    <Link
                      href={
                        process.env.NEXT_PUBLIC_ETHERSCAN_URL +
                        `address/` +
                        guest[0]
                      }
                      passHref
                    >
                      <a>
                        <Ens address={guest[0]} />
                      </a>
                    </Link>
                  </Text>
                </Text>
                <Text as="p" css={{ margin: `0 0 8px` }}>
                  {guest[1]}
                </Text>
                <Text as="p" css={{ margin: `0 0 8px` }}>
                  <Text as="small">
                    at{` `}
                    <Link
                      href={
                        process.env.NEXT_PUBLIC_ETHERSCAN_URL +
                        `block/` +
                        BigNumber.from(guest[2]._hex).toString()
                      }
                      passHref
                    >
                      {BigNumber.from(guest[2]._hex).toString()}
                    </Link>
                  </Text>
                </Text>
              </Box>
            ))}
    </Box>
  );
}
