import { styled } from '@/lib/stitches.config'

export default function H4({ children, ...props }: any) {
  const Text = styled('h4', {
    fontFamily: '$system',
    fontSize: '$fontSizes$3',
    fontWeight: 'bold',
    lineHeight: 'auto',
    margin: '0 0 $space$1',
    ...props.css,
  })
  return <Text>{children}</Text>
}
