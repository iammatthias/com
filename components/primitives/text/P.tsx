import { styled } from '@/lib/stitches.config'

export default function P({ children }: any) {
  const Text = styled('p', {
    fontFamily: '$system',
    fontSize: '$fontSizes$2',
    lineHeight: '$space$5',
    margin: '0',
  })
  return <Text>{children}</Text>
}
