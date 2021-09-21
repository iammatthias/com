/** @jsxImportSource theme-ui */

// guestbook list

import { useMoralisCloudFunction } from 'react-moralis'
import { Box } from 'theme-ui'
import Link from 'next/link'
import Loading from './loading'

export default function GuestbookList({ props }) {
  const { data, error, isLoading } = useMoralisCloudFunction('getGuestbook')

  if (isLoading) {
    return (
      <>
        <Loading />
        <hr />
      </>
    )
  }

  if (error) {
    console.error(error)
    return <span>error</span>
  }

  console.log(data)
  if (data) {
    console.log(data)
    return (
      <>
        {data.map(guest => (
          <Box
            key={guest.ethAddress}
            sx={{
              bg: 'elevated',
              my: '1rem',
              width: ['calc(100vw - 4rem)', '50%'],
              p: '.5rem',
              borderRadius: '4px',
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
              {new Date(guest.updatedAt).toLocaleDateString('en-gb')} at{' '}
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
              </Link>
            </p>
          </Box>
        ))}
      </>
    )
  }
  return <span>foo</span>
}
