import { styled } from '@/lib/stitches.config'

export default function Small({ children }: any) {
  const Text = styled('small', {
    fontFamily: '$system',
    fontSize: '$fontSizes$1',
    fontWeight: 'normal',
    lineHeight: 'auto',
    margin: '0',
  })
  return <Text>{children}</Text>
}
