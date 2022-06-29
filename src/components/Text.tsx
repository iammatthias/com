// Text.tsx
// Language: typescript

import React from 'react';
import { fontStyles, TextVariants } from '@/styles/typography.css';

import Box from '@/components/Box';

type Props = {
  children: React.ReactNode;
  as?: React.ElementType;
} & TextVariants;

const Text = ({ kind, children, as }: Props) => {
  return (
    <Box className={fontStyles({ kind })} as={as || kind}>
      {children}
    </Box>
  );
};

export default Text;
