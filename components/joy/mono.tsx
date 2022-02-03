// mono

import { styled } from '@/lib/stitches.config'

export default function Mono({ children, props }: any) {
  const Text = styled('span', { fontFamily: `'Inconsolata', mono` })
  return <Text {...props}>{children}</Text>
}
