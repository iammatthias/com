import { useContractWrite, useProvider, useWaitForTransaction } from 'wagmi'

import Button from '@/components/primitives/button'
import P from '@/components/primitives/text/P'
import Small from '@/components/primitives/text/small'
import Anchor from '@/components/primitives/text/Anchor'

import abi from '@/lib/contracts/abi.json'

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
    console.log(message.message)
    await signTheGuestBook({
      args: message.message,
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
            <P>
              <Small>
                <Anchor
                  href={
                    process.env.NEXT_PUBLIC_ETHERSCAN_URL +
                    'tx/' +
                    transactionData.transactionHash
                  }
                >
                  hash: {transactionData.transactionHash}
                </Anchor>
              </Small>
            </P>
            <P>Message posted.</P>
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
