import { Box } from '@/components/primitives/box';
import { Text } from '@/components/primitives/text';
import Squiggle from '../squiggle';
import Link from 'next/link';

import { useContractRead, useProvider } from 'wagmi';
import { BigNumber } from 'ethers';
import he from 'he';
import abi from '@/lib/contract/abi.json';
import Ens from './ens';

export default function Guestlist() {
  const contractAddress = process.env.NEXT_PUBLIC_TARGET_CONTRACT_ADDRESS;

  const provider = useProvider();

  const [{ data: allGuests, loading }] = useContractRead(
    {
      addressOrName: contractAddress,
      contractInterface: abi.abi,
      signerOrProvider: provider,
    } as any,
    `getAllGuests`,
    // {
    //   watch: true,
    // },
  );

  return (
    <Box className="guests">
      {loading
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
                        guest.guest
                      }
                      passHref
                    >
                      <Ens address={guest.guest} />
                    </Link>
                  </Text>
                </Text>
                <Text as="p" css={{ margin: `0 0 8px` }}>
                  {he.decode(guest.message)}
                </Text>
                <Text as="p" css={{ margin: `0 0 8px` }}>
                  <Text as="small">
                    at{` `}
                    <Link
                      href={
                        process.env.NEXT_PUBLIC_ETHERSCAN_URL +
                        `block/` +
                        BigNumber.from(guest.timestamp._hex).toString()
                      }
                      passHref
                    >
                      {BigNumber.from(guest.timestamp._hex).toString()}
                    </Link>
                  </Text>
                </Text>
              </Box>
            ))}
    </Box>
  );
}
