import { styled, keyframes } from '@/lib/stitches.config'

export default function Button({ children }: any) {
  const Butt = styled('button', {
    fontFamily: '$system',
    fontSize: '$fontSizes$2',
    padding: '1rem 2rem',
    color: '#fff',
    backgroundColor: '#000',
    border: '2px solid #000',
    borderRadius: '4px',
  })
  return <Butt>{children}</Butt>
}
