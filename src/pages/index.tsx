// index.tsx
// Language: typescript

import Box from '@/components/Box';
import Layout from '@/components/Layout';
import Text from '@/components/Text';

export default function Home() {
  return (
    <Box>
      <Text as="h1" kind="h4">
        I AM
      </Text>
      <Text kind="h1">MATTHIAS</Text>
      <Text kind="p">content will go here</Text>
    </Box>
  );
}
