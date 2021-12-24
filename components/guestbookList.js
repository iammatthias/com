/** @jsxImportSource theme-ui */

// guestbook list

import { useMoralisCloudFunction } from 'react-moralis'
import ENS, { getEnsAddress } from '@ensdomains/ensjs'
import { ethers } from 'ethers'
import { Box } from 'theme-ui'
import Link from 'next/link'
import Loading from './loading'
import Squiggle from './squiggle'

export default function GuestbookList({ props }) {
  const { data, error, isLoading } = useMoralisCloudFunction('getGuestbook')

  const provider = new ethers.providers.JsonRpcProvider(
    process.env.NEXT_PUBLIC_MORALIS_SPEEDY_NODE,
  )

  const ens = new ENS({ provider, ensAddress: getEnsAddress('1') })

  if (isLoading) {
    return (
      <Box sx={{ width: 'fit-content', margin: '0 auto' }}>
        <Loading />
        <Squiggle />
      </Box>
    )
  }

  if (error) {
    console.error(error)
    return <span>error</span>
  }
  if (data) {
    return (
      <>
        {data.map(guest => (
          <Box
            key={guest.ethAddress}
            sx={{
              my: '1rem',
              width: 'fit-content',
            }}
          >
            <small
              sx={{
                m: 0,
                p: '0 0 1rem',
                fontWeight: 'bold',
                fontFamily: 'monospace',
              }}
            >
              {new Date(guest.updatedAt).toLocaleDateString('en-US')} at{' '}
              {new Date(guest.updatedAt).toLocaleTimeString('en-US')}
            </small>
            <p
              sx={{
                m: 0,
                p: '0',
                overflow: 'scroll',
                fontFamily: 'monospace',
                a: {
                  fontWeight: 'normal',
                  fontFamily: 'inherit',
                  textDecoration: 'none',
                },
              }}
            >
              <Link href={'https://etherscan.io/address/' + guest.ethAddress}>
                {guest.ethAddress}
                {/* {ens.getName(guest.ethAddress)} */}
              </Link>
            </p>
            <Squiggle
              sx={{
                width: 'fit-content',
              }}
            />
          </Box>
        ))}
      </>
    )
  }
  return <span>foo</span>
}
