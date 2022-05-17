// button.tsx
import { styled } from '@/styles/stitches.config';

export const GuestbookButton = styled(`button`, {
  margin: `0 16px 0 0`,
  background: `var(--rk-colors-connectButtonBackground)`,
  width: `fit-content`,
  padding: `8px`,
  borderRadius: `var(--rk-radii-connectButton)`,
  border: `2px solid var(--rk-colors-connectButtonBackground)`,
  boxShadow: `var(--rk-shadows-connectButton)`,
  fontFamily: `var(--rk-fonts-body)`,
  fontSize: `16px`,
  fontWeight: `700`,

  color: `var(--rk-colors-connectButtonText)`,
  '&:hover': {
    transform: `scale(1.025)`,
  },
});
