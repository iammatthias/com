import { styled, keyframes } from '@/lib/stitches.config'

export default function Button({ children }: any) {
  const Butt = styled('button', {
    fontFamily: '$system',
    fontSize: '$fontSizes$2',
    padding: '1rem 2rem',
    color: '$colors$slate1',
    backgroundColor: '$colors$slate12',
    border: '1px solid $colors$slate12',
    borderRadius: '4px',
    $$shadowColor: '$colors$slate12',
    '&:hover': {
      boxShadow: `0 0 0 1px $$shadowColor`,
      color: '$colors$slate12',
      backgroundColor: 'transparent',
    },
    '&:focus': { outline: 'none', boxShadow: `0 0 0 1px $$shadowColor` },
  })
  return <Butt>{children}</Butt>
}
