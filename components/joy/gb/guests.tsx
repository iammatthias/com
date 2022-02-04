import Box from '@/components/primitives/box'
import P from '@/components/primitives/text/P'
import Small from '@/components/primitives/text/small'
import Squiggle from '../squiggle'
import abi from '@/lib/contracts/abi.json'
import Ens from './ens'
import Anchor from '@/components/primitives/text/Anchor'

import { useContractRead, useProvider } from 'wagmi'
import BigNumber from 'bignumber.js'

export default function Guests() {
  const contractAddress = process.env.NEXT_PUBLIC_TARGET_CONTRACT_ADDRESS

  const provider = useProvider()

  const [{ data: allGuests, loading }, read] = useContractRead(
    {
      addressOrName: contractAddress,
      contractInterface: abi.abi,
      signerOrProvider: provider,
    } as any,
    'getAllGuests',
    // {
    //   watch: true,
    // },
  )

  return (
    <Box className="guests">
      {loading
        ? null
        : allGuests &&
          allGuests
            .slice()
            .reverse()
            .map(guest => (
              <Box key={guest}>
                <Squiggle />
                <P css={{ margin: '8px 0' }}>
                  <Anchor
                    href={
                      process.env.NEXT_PUBLIC_ETHERSCAN_URL +
                      '/address/' +
                      guest.guest
                    }
                  >
                    <Ens address={guest.guest} />
                  </Anchor>
                </P>
                <P css={{ margin: '0 0 8px' }}>{guest.message}</P>
                <P css={{ margin: '0 0 8px' }}>
                  <Small>
                    at{' '}
                    <Anchor
                      href={
                        process.env.NEXT_PUBLIC_ETHERSCAN_URL +
                        '/block/' +
                        new BigNumber(guest.timestamp._hex).toString()
                      }
                    >
                      {new BigNumber(guest.timestamp._hex).toString()}
                    </Anchor>
                  </Small>
                </P>
              </Box>
            ))}
    </Box>
  )
}
