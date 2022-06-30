// Text.tsx
// Language: typescript

import Box from '@/components/Box';
import { fontStyles, TextVariants } from '@/styles/typography.css';

type Props = {
  children: React.ReactNode;
  as?: React.ElementType;
} & TextVariants;

const Text = ({ kind, children, as = `p` }: Props) => {
  return (
    <Box className={fontStyles({ kind })} as={as}>
      {children}
    </Box>
  );
};

export default Text;
