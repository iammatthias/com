import { useContractWrite, useProvider, useWaitForTransaction } from 'wagmi'
import he from 'he'

import Button from '@/components/primitives/button'
import P from '@/components/primitives/text/P'
import Small from '@/components/primitives/text/small'
import Anchor from '@/components/primitives/text/Anchor'
import MaxTokens from './maxTokens'
import TokenCount from './tokenCount'

import abi from '@/lib/contracts/abi.json'

export default function WriteMessage(message: any) {
  const contractAddress = process.env.NEXT_PUBLIC_TARGET_CONTRACT_ADDRESS

  const provider = useProvider()

  const [
    { data: writeWithoutMintData, error: writeWithoutMintError },
    signWithoutMint,
  ] = useContractWrite(
    {
      addressOrName: contractAddress as string,
      contractInterface: abi.abi,
      signerOrProvider: provider,
    },
    'signWithoutMint',
  )

  const [{ data: writeWithMintData, error: writeWithMintError }, signWithMint] =
    useContractWrite(
      {
        addressOrName: contractAddress as string,
        contractInterface: abi.abi,
        signerOrProvider: provider,
      },
      'signWithMint',
    )

  function toUnicode(str: string) {
    return str
      .split('')
      .map(function (value, index, array) {
        var temp = value.charCodeAt(0).toString(16).toUpperCase()
        if (temp.length > 2) {
          return '\\u' + temp
        }
        return value
      })
      .join('')
  }

  const encoded = he.encode(message.message)

  const handleWriteWithoutMint = async () => {
    await signWithoutMint({
      args: encoded,
    })
  }

  const handleWriteWithMint = async () => {
    await signWithMint({
      args: encoded,
    })
  }

  const writeData: any = writeWithMintData || writeWithoutMintData
  const writeError: any = writeWithMintError || writeWithoutMintError

  const maxTokens: any = MaxTokens()
  const tokenCount: any = TokenCount()

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
        <>
          {tokenCount < maxTokens + 1 && (
            <Button onClick={handleWriteWithMint}>Write With Mint</Button>
          )}
          <Button onClick={handleWriteWithoutMint}>Write Without Mint</Button>
        </>
      )}
      {writeError && <P>{writeError?.message}</P>}
    </>
  )
}
