/** @jsxImportSource theme-ui */
import { Button, Box } from 'theme-ui'
import { useEffect } from 'react'
import { useContractWrite, useSigner } from 'wagmi'

import abi from '../../lib/abi.json'

import Loading from '../loading'
import ClientOnly from '../clientOnly'

export default function Claim(message) {
  const contractAddress = process.env.NEXT_PUBLIC_TARGET_CONTRACT_ADDRESS

  const [{ data: signer }] = useSigner()

  const [{ data: writeData, loading, error }, signTheGuestBook] =
    useContractWrite(
      {
        addressOrName: contractAddress,
        contractInterface: abi.abi,
        signerOrProvider: signer,
      },
      'signTheGuestBook',
    )

  const handleClaim = async () => {
    await signTheGuestBook({
      args: [message.message],
    })
  }
  const refresh = () => {
    window.location.reload(false)
  }

  return (
    <>
      {writeData ? (
        <>
          <p>
            hash:{' '}
            <a
              href={
                process.env.NEXT_PUBLIC_ETHERSCAN_URL + '/tx/' + writeData.hash
              }
            >
              {writeData.hash}
            </a>
          </p>
          <ClientOnly>
            <Button sx={{ display: 'block', mr: 4, mb: 4 }} onClick={refresh}>
              Reset
            </Button>
          </ClientOnly>
        </>
      ) : (
        <Button sx={{ display: 'block', mr: 4, mb: 4 }} onClick={handleClaim}>
          Add Message & Claim NFT
        </Button>
      )}
      {error && <Box sx={{ mb: 4 }}>{error?.message}</Box>}
    </>
  )
}
