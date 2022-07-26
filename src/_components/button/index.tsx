// Button
// Language: typescript

// A reusable button component.

import React from 'react';

import Box from '@/_components/Box';

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
