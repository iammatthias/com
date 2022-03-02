import { styled } from '@/lib/stitches.config'

export default function P({ children, ...props }: any) {
  const Text = styled('p', {
    fontFamily: '$body',
    fontSize: '$fontSizes$2',
    lineHeight: '$space$5',
    margin: '0',
    overflowWrap: 'break-word',
    ...props.css,
  })
  return <Text>{children}</Text>
}
