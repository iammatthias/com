/** @jsxImportSource theme-ui */
import { Box } from 'theme-ui'
import Link from 'next/link'
import ColorSwitcher from './colorSwitcher'

export default function Nav() {
  return (
    <Box className="nav" sx={{ a: { pr: 4 } }}>
      <Link href="/">//</Link>
      <Link href="/work">work</Link>
      <Link href="/blog">blog</Link>
      <Link href="/guestbook">guestbook</Link>
      <ColorSwitcher />
    </Box>
  )
}
