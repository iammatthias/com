/** @jsxImportSource theme-ui */
import { Box } from 'theme-ui'
import Link from 'next/link'
import ColorSwitcher from './colorSwitcher'
import Logo from './logo'

export default function Nav() {
  return (
    <Box
      sx={{
        display: 'grid',
        gridArea: 'nav',
        gridTemplateAreas: [
          '"logo toggle" "menu menu"',
          '',
          '"logo" "menu" "toggle"',
        ],
        gridTemplateRows: ['1fr 2fr', '', 'auto auto 1fr'],
        gridTemplateColumns: ['1fr 1fr', '', '1fr'],
        gridGap: [3, '', 0],
      }}
    >
      <Box
        sx={{
          gridArea: 'logo',
          mb: [0, '', 3],
          textAlign: ['left', '', 'center'],
        }}
      >
        <Link href="/" passHref>
          <Logo />
        </Link>
      </Box>
      <Box
        sx={{
          gridArea: 'menu',
          mb: [0, '', 3],
          padding: [1, '', 3],
          bg: 'background',
          borderRadius: '4px',
          boxShadow: 'card',
          height: 'fit-content',
          justifyContent: 'center',
          alignContent: 'center',
          textAlign: 'center',
          '> a': {
            display: ['inline-block', '', 'block'],
            writingMode: ['', '', 'vertical-rl'],
            lineHeight: ['3', '', '.35'],
            color: 'text',
            pb: [0, '', 3],
            px: [2, '', 0],
            '&:last-child': {
              pb: [0, 0, 0],
              px: [2, '', 0],
            },
          },
        }}
      >
        <Link href="/">home</Link>
        <Link href="/work">work</Link>
        <Link href="/blog">blog</Link>
        <Link href="/about">about</Link>
        <Link href="/guestbook">guestbook</Link>
      </Box>
      <Box
        sx={{
          gridArea: 'toggle',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <ColorSwitcher />
      </Box>
    </Box>
  )
}
