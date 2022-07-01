// Text
// Language: typescript

// Text component that consumes a `kind` and `as prop to render the appropriate semantic text element.

import Box from '@/components/Box';
import { fontStyles, TextVariants } from '@/styles/typography.css';

type Props = {
  children: React.ReactNode;
  as?: React.ElementType;
} & TextVariants;

export default function Text({ kind, children, as = `p` }: Props) {
  return (
    <Box className={fontStyles({ kind })} as={as}>
      {children}
    </Box>
  );
}
