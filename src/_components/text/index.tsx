import React from 'react';
import { textRecipe, TextVariants } from './text.css';
import Box from '@/_components/Box';

type Props = {
  children: React.ReactNode;
  as?: React.ElementType;
} & TextVariants;

const Text = ({
  as = `p`,
  kind = `p`,
  font,
  bold = false,
  italic = false,
  children,
}: Props) => {
  return (
    <Box as={as} className={textRecipe({ font, kind, bold, italic })}>
      {children}
    </Box>
  );
};

export default Text;
