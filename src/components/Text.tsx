// Box.tsx
// Language: typescript
import React from 'react';
import { fontStyles, TextVariants } from '@/styles/typography.css';

import Box from '@/components/Box';

type Props = {
  children: React.ReactNode;
} & TextVariants;

const Text = ({ kind, children }: Props) => {
  return (
    <Box className={fontStyles({ kind })} as={kind}>
      {children}
    </Box>
  );
};

export default Text;
