import { styled } from '@/lib/stitches.config'

export default function H1({ children, ...props }: any) {
  const Text = styled('h1', {
    fontFamily: '$system',
    fontSize: '$fontSizes$6',
    fontWeight: 'bold',
    lineHeight: 'auto',
    margin: '$space$4 0',
    ...props.css,
  })
  return <Text>{children}</Text>
}
