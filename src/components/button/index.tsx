import React from 'react';

import Box from '@/components/box';

import { buttonRecipe, ButtonVariants } from './button.css';

type Props = {
  children: React.ReactNode;
  onClick?: () => void;
} & ButtonVariants;

export const Button = ({ children, onClick, kind = `secondary` }: Props) => {
  return (
    <Box as="button" onClick={onClick} className={buttonRecipe({ kind })}>
      {children}
    </Box>
  );
};

export default Button;
