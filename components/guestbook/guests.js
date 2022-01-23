/** @jsxImportSource theme-ui */
import { Box } from 'theme-ui'

import { useContractRead, useProvider } from 'wagmi'
import BigNumber from 'bignumber.js'

import abi from '../../lib/abi.json'

import Ens from './ens'
import Squiggle from '../joy/squiggle'
import Loading from '../loading'

export default function Guests() {
  const contractAddress = process.env.NEXT_PUBLIC_TARGET_CONTRACT_ADDRESS

  const provider = useProvider()
  const [{ data: allGuests, loading }, read] = useContractRead(
    {
      addressOrName: contractAddress,
      contractInterface: abi.abi,
      signerOrProvider: provider,
    },
    'getAllGuests',
    {
      watch: true,
    },
  )

  return loading ? (
    <Loading />
  ) : (
    <Box>
      {allGuests &&
        allGuests
          .slice(0)
          .reverse()
          .map(guest => (
            <Box
              key={guest}
              sx={{
                width: 'fit-content',
              }}
            >
              <p sx={{ m: 0, mb: 1 }}>
                <a
                  href={
                    process.env.NEXT_PUBLIC_ETHERSCAN_URL +
                    '/address/' +
                    guest.guest
                  }
                >
                  <Ens address={guest.guest} />
                </a>
              </p>
              <p sx={{ m: 0, mb: 1 }}>{guest.message}</p>
              <p sx={{ m: 0, mb: 1 }}>
                <small>
                  at{' '}
                  <a
                    href={
                      process.env.NEXT_PUBLIC_ETHERSCAN_URL +
                      '/block/' +
                      BigNumber(guest.timestamp._hex).toString()
                    }
                  >
                    {BigNumber(guest.timestamp._hex).toString()}
                  </a>
                </small>
              </p>
              <Squiggle />
            </Box>
          ))}
    </Box>
  )
}
