// button.tsx
import { styled } from '@/styles/stitches.config';
import MagicHeaderCopy from '../joy/magicHeaderCopy';

export default function Text({ children, ...props }: any) {
  const Text = styled(`p`);

  const as: any = `${props.as || `p`}`;

  const isH = as.startsWith(`h`);

  return (
    <Text as={as}>
      {isH ? <MagicHeaderCopy>{children}</MagicHeaderCopy> : children}
    </Text>
  );
}
