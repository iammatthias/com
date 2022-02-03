import { styled } from '@stitches/react'
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
  $$shadowColor: '$colors$slate12',
  '&:hover': { boxShadow: `0 0 0 1px $$shadowColor` },
  '&:focus': { outline: 'none', boxShadow: `0 0 0 1px $$shadowColor` },
  '&:last-child': {
    marginRight: '0',
    marginLeft: 'auto',
    borderRadius: '50px',
  },
})

export default function Nav() {
  return (
    <Box
      className="nav"
      css={{
        verticalAlign: 'middle',
        fontSize: '15px',
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      <Tooltip copy="Home">
        <Span tabIndex={0}>
          <Link href="/" passHref>
            <Icon>
              <HomeIcon />
            </Icon>
          </Link>
        </Span>
      </Tooltip>
      <Tooltip copy="Work">
        <Span tabIndex={0}>
          <Link href="/work" passHref>
            <Icon>
              <CameraIcon />
            </Icon>
          </Link>
        </Span>
      </Tooltip>
      <Tooltip copy="Blog">
        <Span tabIndex={0}>
          <Link href="/blog" passHref>
            <Icon>
              <FileTextIcon />
            </Icon>
          </Link>
        </Span>
      </Tooltip>
      <Tooltip copy="Guestbook">
        <Span tabIndex={0}>
          <Link href="/guestbook" passHref>
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
  )
}
