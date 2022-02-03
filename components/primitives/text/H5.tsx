import { styled } from '@/lib/stitches.config'

export default function H5({ children }: any) {
  const Text = styled('h5', {
    fontFamily: '$system',
    fontSize: '$fontSizes$2',
    fontWeight: 'bold',
    lineHeight: 'auto',
    margin: '0',
  })
  return <Text>{children}</Text>
}
