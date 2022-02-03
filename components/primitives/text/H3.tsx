import { styled } from '@/lib/stitches.config'

export default function H3({ children }: any) {
  const Text = styled('h3', {
    fontFamily: '$system',
    fontSize: '$fontSizes$4',
    fontWeight: 'bold',
    lineHeight: 'auto',
    margin: '0 0 $space$2',
  })
  return <Text>{children}</Text>
}
