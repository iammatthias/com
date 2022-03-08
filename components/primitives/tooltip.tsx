import { styled, keyframes } from '@/lib/stitches.config'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'

export default function Tooltip({ children, copy, iframe }: any) {
  const slideUpAndFade = keyframes({
    '0%': { opacity: 0, transform: 'translateY(2px)' },
    '100%': { opacity: 1, transform: 'translateY(0)' },
  })

  const slideRightAndFade = keyframes({
    '0%': { opacity: 0, transform: 'translateX(-2px)' },
    '100%': { opacity: 1, transform: 'translateX(0)' },
  })

  const slideDownAndFade = keyframes({
    '0%': { opacity: 0, transform: 'translateY(-2px)' },
    '100%': { opacity: 1, transform: 'translateY(0)' },
  })

  const slideLeftAndFade = keyframes({
    '0%': { opacity: 0, transform: 'translateX(2px)' },
    '100%': { opacity: 1, transform: 'translateX(0)' },
  })

  const StyledContent = styled(TooltipPrimitive.Content, {
    borderRadius: 6,
    fontSize: 12,
    lineHeight: 1,
    color: 'black',
    backgroundColor: 'white',
    $$shadowColor: '$colors$slate12',
    boxShadow: `0 0 0 1px $$shadowColor`,
    '@media (prefers-reduced-motion: no-preference)': {
      animationDuration: '400ms',
      animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      willChange: 'transform, opacity',
      '&[data-state="delayed-open"]': {
        '&[data-side="top"]': { animationName: slideDownAndFade },
        '&[data-side="right"]': { animationName: slideLeftAndFade },
        '&[data-side="bottom"]': { animationName: slideUpAndFade },
        '&[data-side="left"]': { animationName: slideRightAndFade },
      },
    },
  })

  const Frame = styled('iframe', {
    borderRadius: 6,
    border: 'none',
    width: '100%',
    height: '100%',
  })
  return (
    <TooltipPrimitive.Provider delayDuration={100}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <StyledContent sideOffset={16}>
          {copy && copy}
          {iframe && <Frame src={iframe} loading="lazy" />}
        </StyledContent>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}
