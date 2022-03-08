import { styled, keyframes } from '@/lib/stitches.config'
import Link from 'next/link'
import Tooltip from '../tooltip'

export default function Anchor({ children, ...props }: any) {
  const Text = styled('span', {
    color: 'inherit',
    fontFamily: '$system',
    fontSize: 'inherit',
    fontWeight: 'bold',
    lineHeight: 'inherit',
    a: {
      color: 'inherit',
      textDecoration: 'none',
    },
  })
  return (
    <Tooltip iframe={props.href}>
      <Text>
        <Link passHref {...props}>
          <a>{children}</a>
        </Link>
      </Text>
    </Tooltip>
  )
}
