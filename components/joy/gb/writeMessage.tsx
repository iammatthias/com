import { useContractWrite, useProvider, useWaitForTransaction } from 'wagmi'

import Box from '@/components/primitives/box'
import Button from '@/components/primitives/button'
import P from '@/components/primitives/text/P'

import abi from '@/lib/contracts/abi.json'

// dynamic imports
// import dynamic from 'next/dynamic'
// const Write = dynamic(() => import('./write'))

export default function WriteMessage(message: any) {
  const contractAddress = process.env.NEXT_PUBLIC_TARGET_CONTRACT_ADDRESS

  const provider = useProvider()

  const [{ data: writeData, loading, error }, signTheGuestBook] =
    useContractWrite(
      {
        addressOrName: contractAddress as string,
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

  const Transaction = (hash: any) => {
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
        {transactionError && <p>There was an error. Please try again later.</p>}{' '}
        {transactionLoading && <p>Writing message to chain...</p>}{' '}
        {transactionData && (
          <>
            <p>hash: {transactionData.transactionHash}</p>
            <p>Message posted.</p>
          </>
        )}
      </div>
    )
  }

  return (
    <>
      {writeData ? (
        <Transaction hash={writeData.hash} />
      ) : (
        <Button onClick={handleWrite}>Add Message</Button>
      )}
      {error && <P>{error?.message}</P>}
    </>
  )
}
