import { styled, keyframes } from '@stitches/react'
import Box from '../primitives/box'
import Tooltip from '../primitives/tooltip'
import Link from 'next/link'
import {
  HomeIcon,
  CameraIcon,
  FileTextIcon,
  FaceIcon,
} from '@radix-ui/react-icons'
import ColorToggle from '../colorToggle'

export default function Nav() {
  const fadeIn = keyframes({
    from: { boxShadow: `0 0 0 0 $$shadowColor` },
    to: { boxShadow: `0 0 0 1px $$shadowColor` },
  })

  const fadeOut = keyframes({
    from: { boxShadow: `0 0 0 1px $$shadowColor` },
    to: { boxShadow: `0 0 0 0 $$shadowColor` },
  })

  const Icon = styled('div', {
    padding: '12px 12px',
    height: '15px',
  })

  const Span = styled('span', {
    maxWidth: '39px',
    maxHeight: '39px',
    marginRight: '24px',
    border: '1px solid',
    borderColor: 'inherit',
    borderRadius: '4px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',

    animation: `${fadeOut} 328ms ease-out`,
    $$shadowColor: '$colors$slate12',
    '&:hover': {
      boxShadow: `0 0 0 1px $$shadowColor`,
      animation: `${fadeIn} 328ms ease-out`,
      // mixBlendMode: 'multiply',
      // backdropFilter: 'invert(100%) opacity(25%) saturate(1000%)',
    },
    '&:focus': { outline: 'none', boxShadow: `0 0 0 1px $$shadowColor` },
    '&:last-child': {
      marginRight: '0',
      marginLeft: 'auto',
      borderRadius: '50px',
    },
  })
  return (
    <Box
      className="nav"
      css={{
        position: 'relative',
        margin: '0 auto',
        padding: '1rem',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 6fr 1fr 1fr 1fr',
        gridTemplateRows: 'auto',
        gridGap: '1rem',
        '> *': {
          gridColumn: '1 / 8',
        },

        '@bp1': {
          '> *': {
            gridColumn: '1 / 8',
          },
        },
        '@bp2': {
          '> *': {
            gridColumn: '2 / 7',
          },
        },
        '@bp3': {
          '> *': {
            gridColumn: '3 / 6',
          },
        },
        '@bp4': {
          '> *': {
            gridColumn: '4 / 5',
          },
        },
      }}
    >
      <Box
        css={{
          verticalAlign: 'middle',
          fontSize: '15px',
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <Tooltip copy="Home">
          <Span tabIndex={0}>
            <Link href="/" scroll={false}>
              <Icon>
                <HomeIcon />
              </Icon>
            </Link>
          </Span>
        </Tooltip>
        <Tooltip copy="Work">
          <Span tabIndex={0}>
            <Link href="/work">
              <Icon>
                <CameraIcon />
              </Icon>
            </Link>
          </Span>
        </Tooltip>
        <Tooltip copy="Blog">
          <Span tabIndex={0}>
            <Link href="/blog">
              <Icon>
                <FileTextIcon />
              </Icon>
            </Link>
          </Span>
        </Tooltip>
        <Tooltip copy="Guestbook">
          <Span tabIndex={0}>
            <Link href="/guestbook">
              <Icon>
                <FaceIcon />
              </Icon>
            </Link>
          </Span>
        </Tooltip>

        <Tooltip copy="Color Mode">
          <Span tabIndex={0}>
            <ColorToggle />
          </Span>
        </Tooltip>
      </Box>
    </Box>
  )
}
