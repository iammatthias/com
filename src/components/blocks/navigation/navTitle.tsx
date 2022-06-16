import { Box } from '@/components/primitives/box';
import Text from '@/components/primitives/text';

export default function NavTitle() {
  return (
    <Box
      css={{
        textAlign: `center`,
        lineHeight: `1`,
      }}
    >
      <Text as="h4">I am</Text>
      <Text as="h1" css={{ margin: `0` }}>
        Matthias
      </Text>
    </Box>
  );
}
