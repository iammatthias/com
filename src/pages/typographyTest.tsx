// index.tsx
// Language: typescript

import Box from '@/components/Box';
import Layout from '@/components/Layout';
import Text from '@/components/Text';

export default function Home() {
  return (
    <Layout layout="list">
      <Text kind="h1">h1</Text>
      <Text kind="h2">h2</Text>
      <Text kind="h3">h3</Text>
      <Text kind="h4">h4</Text>
      <Text kind="h5">h5</Text>
      <Text kind="h6">h6</Text>
      <Text kind="small">small</Text>
      <Text kind="p">
        <Text kind="strong">bold</Text>
      </Text>
      <Text kind="p">
        <Text kind="em">italic</Text>
      </Text>
    </Layout>
  );
}
