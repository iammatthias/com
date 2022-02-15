import { styled, keyframes } from '@/lib/stitches.config'

export default function Button({ children, ...props }: any) {
  const fadeIn = keyframes({
    from: { boxShadow: `0 0 0 0 $$shadowColor` },
    to: { boxShadow: `0 0 0 1px $$shadowColor` },
  })

  const fadeOut = keyframes({
    from: { boxShadow: `0 0 0 1px $$shadowColor` },
    to: { boxShadow: `0 0 0 0 $$shadowColor` },
  })

  const Butt = styled('button', {
    cursor: 'pointer',
    width: 'fit-content',
    fontFamily: '$system',
    fontSize: '$fontSizes$2',
    padding: '8px 16px',
    color: '$colors$slate1',
    backgroundColor: '$colors$slate12',
    border: '1px solid $colors$slate12',
    borderRadius: '4px',
    animation: `${fadeOut} 328ms ease-out`,
    $$shadowColor: '$colors$slate12',
    '&:hover': {
      background: 'transparent',
      boxShadow: `0 0 0 1px $$shadowColor`,
      animation: `${fadeIn} 328ms ease-out`,
      backdropFilter: 'invert(100%) opacity(38.2%) saturate(1618%)',
    },
    '&:focus': { outline: 'none', boxShadow: `0 0 0 1px $$shadowColor` },
    ...props.css,
  })
  return <Butt {...props}>{children}</Butt>
}
