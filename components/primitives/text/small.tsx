import { styled } from '@/lib/stitches.config'

export default function Small({ children, ...props }: any) {
  const Text = styled('small', {
    fontFamily: '$system',
    fontSize: '$fontSizes$1',
    fontWeight: 'normal',
    lineHeight: 'auto',
    margin: '0',
    ...props.css,
  })
  return <Text>{children}</Text>
}
