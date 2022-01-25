/** @jsxImportSource theme-ui */
import { Button, Alert } from 'theme-ui'
import { useContractWrite, useProvider, useWaitForTransaction } from 'wagmi'

import abi from '../../lib/contracts/abi.json'

export default function Claim(message) {
  const contractAddress = process.env.NEXT_PUBLIC_TARGET_CONTRACT_ADDRESS

  const provider = useProvider()

  const [{ data: writeData, loading, error }, signTheGuestBook] =
    useContractWrite(
      {
        addressOrName: contractAddress,
        contractInterface: abi.abi,
        signerOrProvider: provider,
      },
      'signTheGuestBook',
    )

  const handleWrite = async () => {
    await signTheGuestBook({
      args: [message.message],
    })
  }
  const refresh = () => {
    window.location.reload(false)
  }

  const Transaction = hash => {
    const [
      {
        data: transactionData,
        error: transactionError,
        loading: transactionLoading,
      },
      wait,
    ] = useWaitForTransaction({
      hash: hash.hash,
    })

    return (
      <div>
        {transactionError && (
          <p>Something went wrong. Please try again later.</p>
        )}{' '}
        {transactionLoading && <p>Loading...</p>}{' '}
        {transactionData && <p>hash: {transactionData.transactionHash}</p>}
      </div>
    )
  }

  return (
    <>
      {writeData ? (
        <Transaction hash={writeData.hash} />
      ) : (
        <Button sx={{ display: 'block', mr: 4, mb: 4 }} onClick={handleWrite}>
          Add Message
        </Button>
      )}
      {error && <Alert sx={{ mb: 4 }}>{error?.message}</Alert>}
    </>
  )
}
