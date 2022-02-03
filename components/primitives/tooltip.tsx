import { styled, keyframes } from '@/lib/stitches.config'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'

export default function Tooltip({ children, copy }: any) {
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
    borderRadius: 4,
    padding: '10px 15px',
    fontSize: 12,
    lineHeight: 1,
    color: 'black',
    backgroundColor: 'white',
    boxShadow:
      'hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px',
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
  const StyledArrow = styled(TooltipPrimitive.Arrow, {
    fill: 'white',
  })

  return (
    <TooltipPrimitive.Provider delayDuration={100}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <StyledContent sideOffset={5}>
          {copy}
          <StyledArrow />
        </StyledContent>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}
