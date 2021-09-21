/** @jsxImportSource theme-ui */

// guestbook list

import { useMoralisCloudFunction } from 'react-moralis'
import { Box } from 'theme-ui'
import Link from 'next/link'
import Loading from './loading'

export default async function GuestbookList({ props }) {
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
    return null
  }

  if (data) {
    const GuestList = data.map(guest => {
      let signedAtDate = new Date(guest.updatedAt).toLocaleDateString('en-gb')
      let signedAtTime = new Date(guest.updatedAt).toLocaleTimeString('en-US')
      let address = guest.ethAddress
      return (
        <Box
          key={address}
          sx={{
            bg: lighten('background', 0.025),
            my: '1rem',
            width: ['calc(100vw - 4rem)', '50%'],
            p: '.5rem',
            borderRadius: '4px',
          }}
        >
          <small
            sx={{ m: 0, p: '0 0 1rem', fontWeight: 'bold', fontFamily: 'mono' }}
          >
            {signedAtDate} at {signedAtTime}
          </small>
          <p
            sx={{
              m: 0,
              p: '0',
              overflow: 'scroll',
              textOverflow: 'clip ellipsis',
              fontFamily: 'mono',
            }}
          >
            å
            <Link
              href={'https://etherscan.io/address/' + address}
              sx={{ fontWeight: 'normal', textDecoration: 'none' }}
            >
              {address}
            </Link>
          </p>
        </Box>
      )
    })

    return { GuestList }
  }
}
