// button.tsx
import { styled } from '@/styles/stitches.config';

export const Button = styled(`button`, {
  // styles
  margin: `1rem 0 0`,
  padding: `0.5rem 1rem`,
  borderRadius: `6px`,
  border: `2px solid`,
  textDecoration: `none`,
  lineHeight: `0`,
  verticalAlign: `middle`,
  variants: {
    color: {
      standard: {
        borderColor: `$primary`,
        backgroundColor: `$background`,
        color: `$primary`,
        '&:hover': {
          borderColor: `$turq`,
          backgroundColor: `$primary`,
          color: `$background`,
        },
      },
    },
  },
  defaultVariants: {
    color: `standard`,
  },
  '&:focus': { outline: `none` },
});
