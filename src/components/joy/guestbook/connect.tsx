import { Box } from '@/components/primitives/box';
import { Button } from '@/components/primitives/button';
import { Text } from '@/components/primitives/text';

import { useConnect } from 'wagmi';

export default function Connect() {
  const [
    {
      data: { connectors },
      error,
      loading,
    },
    connect,
  ] = useConnect();

  return (
    <Box css={{ margin: `0 0 16px` }}>
      {connectors.map(
        (connector) =>
          connector.ready && (
            <Button
              css={{ padding: `16px`, margin: `0 16px 0 0` }}
              key={connector.id}
              onClick={() => connect(connector)}
            >
              <Text as="p">{connector.name}</Text>
            </Button>
          ),
      )}
      {loading && <Text as="p">Loading...</Text>}
      {error && <Text as="p">{error?.message ?? `Failed to connect`}</Text>}
    </Box>
  );
}
