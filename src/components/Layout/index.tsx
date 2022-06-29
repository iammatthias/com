import React from 'react';
import { layoutRecipe, LayoutVariants } from './Layout.css';
import Box from '@/components/Box';

type Props = {
  children: React.ReactNode;
} & LayoutVariants;

export const Layout = ({ children, layout = `page` }: Props) => {
  return (
    <Box as="section" className={layoutRecipe({ layout })}>
      {children}
    </Box>
  );
};

export default Layout;
