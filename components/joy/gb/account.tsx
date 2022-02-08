import { useState, useEffect } from 'react'
import Box from '@/components/primitives/box'
import Button from '@/components/primitives/button'
import P from '@/components/primitives/text/P'
import Small from '@/components/primitives/text/small'

import { useAccount, useNetwork } from 'wagmi'

export default function Account() {
  const contractAddress = process.env.NEXT_PUBLIC_TARGET_CONTRACT_ADDRESS
  const [{ data: accountData }, disconnect] = useAccount({
    fetchEns: true,
  })

  // get current network
  const [{ data: networkData }, switchNetwork] = useNetwork()

  if (!accountData) return <Box>No account connected</Box>

  return (
    <Box>
      <Box>
        <Button onClick={() => disconnect()} css={{ margin: '0 0 16px' }}>
          Disconnect from {accountData?.connector?.name}
        </Button>
      </Box>
      <Box>
        <Box
          css={{
            border: '1px solid',
            borderColor: 'text',
            borderRadius: '4px',
            margin: '0 0 16px',
            padding: '8px',
            wordBreak: 'break-word',
            width: '100%',
          }}
        >
          <P css={{ margin: '0 0 8px' }}>
            <Small>
              connected as{' '}
              <a
                href={
                  process.env.NEXT_PUBLIC_ETHERSCAN_URL +
                  '/address/' +
                  accountData.address
                }
                target="_blank"
                rel="noreferrer"
              >
                {accountData?.ens?.name ?? accountData?.address}
              </a>
            </Small>
          </P>
          <P css={{ margin: '0 0 8px' }}>
            <Small>
              contract:{' '}
              <a
                href={
                  process.env.NEXT_PUBLIC_ETHERSCAN_URL +
                  '/address/' +
                  contractAddress
                }
                target="_blank"
                rel="noreferrer"
              >
                {contractAddress}
              </a>
            </Small>
          </P>

          <P css={{ margin: '0' }}>
            <Small>
              network: {networkData.chain?.name ?? networkData.chain?.id}{' '}
              {networkData.chain?.unsupported && '(unsupported)'}
            </Small>
          </P>
        </Box>
      </Box>
    </Box>
  )
}
