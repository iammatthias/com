import { styled } from '@/lib/stitches.config'

export default function Span({ children }: any) {
  const Text = styled('span')
  return <Text>{children}</Text>
}
