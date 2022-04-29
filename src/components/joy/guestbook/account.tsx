import { Box } from '@/components/primitives/box';
import { Button } from '@/components/primitives/button';
import { Text } from '@/components/primitives/text';

import { useAccount, useDisconnect, useNetwork } from 'wagmi';

export default function Account() {
  const contractAddress = process.env.NEXT_PUBLIC_TARGET_CONTRACT_ADDRESS;

  const { disconnect } = useDisconnect();

  const { data: accountData } = useAccount();

  // get current network
  const { activeChain } = useNetwork();

  return (
    <Box>
      {accountData && (
        <Box>
          <Button
            onClick={() => disconnect()}
            css={{ padding: `16px`, margin: `0 16px 16px 0` }}
          >
            <Text as="p">Disconnect from {accountData?.connector?.name}</Text>
          </Button>
        </Box>
      )}
      <Box>
        <Box
          css={{
            border: `1px solid`,
            borderColor: `text`,
            borderRadius: `4px`,
            margin: `0 0 16px`,
            padding: `8px`,
            wordBreak: `break-word`,
            width: `fit-content`,
          }}
        >
          {accountData && (
            <Text as="p" css={{ margin: `0` }}>
              <Text as="small">
                connected as{` `}
                <a
                  href={
                    process.env.NEXT_PUBLIC_ETHERSCAN_URL +
                    `/address/` +
                    accountData.address
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  {accountData?.address}
                </a>
              </Text>
            </Text>
          )}
          <Text as="p" css={{ margin: `0` }}>
            <Text as="small">
              contract:{` `}
              <a
                href={
                  process.env.NEXT_PUBLIC_ETHERSCAN_URL +
                  `/address/` +
                  contractAddress
                }
                target="_blank"
                rel="noreferrer"
              >
                {contractAddress}
              </a>
            </Text>
          </Text>

          <Text as="p" css={{ margin: `0` }}>
            <Text as="small">
              network: {activeChain?.name ?? activeChain?.id}
              {` `}
              {activeChain?.unsupported && `(unsupported)`}
              {!activeChain && `not connected`}
            </Text>
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
