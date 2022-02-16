import { styled } from '@/lib/stitches.config'

export default function H2({ children, ...props }: any) {
  const Text = styled('h2', {
    fontFamily: '$system',
    fontSize: '$fontSizes$5',
    fontWeight: 'bold',
    lineHeight: 'auto',
    margin: '0 0 $space$3',
    ...props.css,
  })
  return <Text>{children}</Text>
}
