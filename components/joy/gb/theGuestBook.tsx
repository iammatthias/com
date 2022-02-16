// guestbook
import { useState } from 'react'
import { useAccount } from 'wagmi'
import { styled, keyframes } from '@stitches/react'
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'
import { RowSpacingIcon, Cross2Icon } from '@radix-ui/react-icons'

// components
import Connect from '@/components/joy/gb/connect'
import Account from './account'
import Box from '@/components/primitives/box'
import P from '@/components/primitives/text/P'
import H3 from '@/components/primitives/text/H3'
import Guests from './guests'
import WriteMessage from './signMessage'
import MaxTokens from './maxTokens'
import Small from '@/components/primitives/text/small'

export default function TheGuestBook() {
  const [open, setOpen] = useState(false)
  const [{ data: accountData }] = useAccount()
  const maxTokens = MaxTokens()

  const Collapsible = CollapsiblePrimitive.Root
  const CollapsibleTrigger = CollapsiblePrimitive.Trigger
  const CollapsibleContent = CollapsiblePrimitive.Content

  const fadeIn = keyframes({
    from: { boxShadow: `0 0 0 0 $$shadowColor` },
    to: { boxShadow: `0 0 0 1px $$shadowColor` },
  })

  const fadeOut = keyframes({
    from: { boxShadow: `0 0 0 1px $$shadowColor` },
    to: { boxShadow: `0 0 0 0 $$shadowColor` },
  })

  const IconButton = styled('button', {
    all: 'unset',
    fontFamily: 'inherit',
    borderRadius: '100%',
    height: 25,
    width: 25,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '1rem',
    border: '1px solid $colors$slate12',
    animation: `${fadeOut} 328ms ease-out`,
    $$shadowColor: '$colors$slate12',
    '&:hover': {
      boxShadow: `0 0 0 1px $$shadowColor`,
      animation: `${fadeIn} 328ms ease-out`,
      backdropFilter: 'invert(100%) opacity(38.2%) saturate(1618%)',
    },
    '&:focus': {
      outline: 'none',
      boxShadow: `0 0 0 1px $$shadowColor`,
    },
    '&:active': {
      outline: 'none',
      boxShadow: `0 0 0 1px $$shadowColor`,
      backdropFilter: 'invert(100%) opacity(25%) saturate(1000%)',
    },
  })

  return (
    <>
      {accountData?.address ? <Account /> : <Connect />}
      <P css={{ margin: '0' }}>
        Write a message on the blockchain. Get it on an NFT (if you want).
      </P>
      <Collapsible open={open} onOpenChange={setOpen}>
        <Box>
          <H3 css={{ display: 'inline' }}>FAQ</H3>
          <CollapsibleTrigger asChild>
            <IconButton>
              {open ? <Cross2Icon /> : <RowSpacingIcon />}
            </IconButton>
          </CollapsibleTrigger>
        </Box>

        <CollapsibleContent>
          <ul>
            <li>
              <b>how many nfts are available?</b>
              <br />
              {maxTokens} max nfts.
            </li>
            <li>
              <b>how many guests can sign the guestbook?</b>
              <br />
              unlimited.
            </li>
            <li>
              <b>does it cost anything?</b>
              <br />
              free to write or mint, user pays network gas fees.
            </li>
            <li>
              <b>why?</b>
              <br />a transaction is incurred when writing to the blockchain.
            </li>
            <li>
              <b>anything we should know before minting?</b>
              <br />
              special characters are not recommended and can break the on-chain
              svg. when minting from this page, special characters are encoded
              to minimize risk.
            </li>
          </ul>
        </CollapsibleContent>
      </Collapsible>

      {accountData && <WriteMessage />}
      <Guests />
    </>
  )
}

export const getStaticProps = async () => {
  return {
    props: {
      metadata: {
        title: 'Guestbook',
      },
    },
  }
}
