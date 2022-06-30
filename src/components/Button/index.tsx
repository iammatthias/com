import React from 'react';

import Box from '@/components/Box';

import { buttonRecipe, ButtonVariants } from './Button.css';

type Props = {
  children: React.ReactNode;
} & ButtonVariants;

export const Button = ({ children, kind = `secondary` }: Props) => {
  return (
    <Box as="button" className={buttonRecipe({ kind })}>
      {children}
    </Box>
  );
};

export default Button;
