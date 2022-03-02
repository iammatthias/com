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
    fontWeight: 'bold',
    padding: '8px 16px',
    color: '$colors$slate12',
    backgroundColor: 'transparent',
    border: '1px solid $colors$slate12',
    borderRadius: '4px',
    animation: `${fadeOut} 328ms ease-out`,
    $$shadowColor: '$colors$slate12',
    backdropFilter: 'opacity(38.2%) saturate(1618%) blur(50px)',

    '&:hover': {
      boxShadow: `0 0 0 1px $$shadowColor`,
      animation: `${fadeIn} 328ms ease-out`,
    },
    '&:focus': {
      outline: 'none',
      boxShadow: `0 0 0 1px $$shadowColor`,
    },
    '&:active': {
      outline: 'none',
      boxShadow: `0 0 0 1px $$shadowColor`,
      backdropFilter: 'invert(100%) opacity(25%) saturate(1000%)',
    },
    ...props.css,
  })
  return <Butt {...props}>{children}</Butt>
}
