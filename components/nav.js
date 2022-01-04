/** @jsxImportSource theme-ui */
import { Box } from 'theme-ui'
import Link from 'next/link'
import ColorSwitcher from './colorSwitcher'
import Logo from './logo'

export default function Nav() {
  return (
    <Box
      sx={{
        gridArea: 'nav',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        // justifyContent: ['center', '', 'start'],
        py: [3, 3, 4],
      }}
    >
      <Box
        sx={{
          gridArea: 'menu',
          width: '100%',
          borderRadius: '4px',
          height: 'fit-content',
          width: 'fit-content',
          textAlign: 'center',
          '> a': {
            textAlign: 'center',
            lineHeight: ['3', '', '.35'],
            color: 'text',
            px: 2,
          },
        }}
      >
        <Link href="/">home</Link>
        <Link href="/work">work</Link>
        <Link href="/blog">blog</Link>
        <Link href="/about">about</Link>
        {/* <Link href="/guestbook">guestbook</Link> */}
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
