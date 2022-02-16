import { styled } from '@/lib/stitches.config'

import Link from 'next/link'

export default function Anchor({ children, ...props }: any) {
  const Text = styled('span', {
    color: 'inherit',
    fontFamily: 'inherit',
    fontSize: 'inherit',
    fontWeight: 'bold',
    lineHeight: 'inherit',
    a: {
      color: 'inherit',
      textDecoration: 'none',
    },
  })
  return (
    <Text>
      <Link passHref {...props}>
        <a>{children}</a>
      </Link>
    </Text>
  )
}
