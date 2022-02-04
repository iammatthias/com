import { styled } from '@/lib/stitches.config'

export default function Span({ children, ...props }: any) {
  const Text = styled('span', { ...props.css })
  return <Text>{children}</Text>
}
