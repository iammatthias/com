import { styled } from '@/lib/stitches.config'

export default function H4({ children }: any) {
  const Text = styled('h4', {
    fontFamily: '$system',
    fontSize: '$fontSizes$3',
    fontWeight: 'bold',
    lineHeight: 'auto',
    margin: '0 0 $space$1',
  })
  return <Text>{children}</Text>
}
