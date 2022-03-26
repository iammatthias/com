// mono

import { styled } from '@/styles/stitches.config';

export default function Mono({ children, props }: any) {
  const Text = styled(`span`, { fontFamily: `'Space Mono', mono` });
  return <Text {...props}>{children}</Text>;
}
