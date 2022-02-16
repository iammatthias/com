import { styled } from '@/lib/stitches.config'

export default function H5({ children, ...props }: any) {
  const Text = styled('h5', {
    fontFamily: '$system',
    fontSize: '$fontSizes$2',
    fontWeight: 'bold',
    lineHeight: 'auto',
    margin: '0',
    ...props.css,
  })
  return <Text>{children}</Text>
}
