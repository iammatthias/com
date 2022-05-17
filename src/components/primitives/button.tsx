// button.tsx
import { styled } from '@/styles/stitches.config';

export const Button = styled(`button`, {
  // styles
  margin: `1rem 0 0`,
  padding: `0.5rem 1rem`,
  border: `none`,
  textDecoration: `none`,
  lineHeight: `0`,
  verticalAlign: `middle`,
  background: `transparent`,
  $$shadowColor: `$colors$primary`,
  boxShadow: `0 0 0 1px $$shadowColor`,
  backdropFilter: `blur(50px) opacity(38.2%) saturate(2618%) `,
  color: `$primary`,
  '&:hover': {
    boxShadow: `0 0 0 2px $$shadowColor`,
  },
  '&:focus': { outline: `none` },
});
