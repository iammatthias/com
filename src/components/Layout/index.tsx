import Box from '@/components/Box';

import { layoutRecipe, LayoutVariants } from './Layout.css';

type Props = {
  children: React.ReactNode;
  as?: React.ElementType;
} & LayoutVariants;

export const Layout = ({ children, layout = `page`, as = `div` }: Props) => {
  return (
    <Box as={as} className={layoutRecipe({ layout })}>
      {children}
    </Box>
  );
};

export default Layout;
