import { useContractWrite, useProvider, useWaitForTransaction } from 'wagmi';
import he from 'he';

import { Button } from '@/components/primitives/button';
import { Text } from '@/components/primitives/text';
import Link from '@/components/primitives/link';
import MaxTokens from './maxTokens';
import TokenCount from './tokenCount';

import abi from '@/lib/contract/abi.json';
import { Box } from '@/components/primitives/box';

export default function WriteMessage(message: any) {
  const contractAddress = process.env.NEXT_PUBLIC_TARGET_CONTRACT_ADDRESS;

  const provider = useProvider();

  const [
    {
      data: writeWithoutMintData,
      error: writeWithoutMintError,
      loading: writeWithoutMintLoading,
    },
    signWithoutMint,
  ] = useContractWrite(
    {
      addressOrName: contractAddress as string,
      contractInterface: abi.abi,
      signerOrProvider: provider,
    },
    `signWithoutMint`,
  );

  const [
    {
      data: writeWithMintData,
      error: writeWithMintError,
      loading: writeWithMintLoading,
    },
    signWithMint,
  ] = useContractWrite(
    {
      addressOrName: contractAddress as string,
      contractInterface: abi.abi,
      signerOrProvider: provider,
    },
    `signWithMint`,
  );

  const encoded = he.encode(message.message);

  const handleWriteWithoutMint = async () => {
    await signWithoutMint({
      args: encoded,
    });
  };

  const handleWriteWithMint = async () => {
    await signWithMint({
      args: encoded,
    });
  };

  const writeData: any = writeWithMintData || writeWithoutMintData;
  const writeError: any = writeWithMintError || writeWithoutMintError;
  const writeLoading: any = writeWithMintLoading || writeWithoutMintLoading;

  const maxTokens: any = MaxTokens();
  const tokenCount: any = TokenCount();

  const Transaction = (hash: any) => {
    const [
      {
        data: transactionData,
        error: transactionError,
        loading: transactionLoading,
      },
    ] = useWaitForTransaction({
      hash: hash.hash,
    });

    return (
      <Box css={{ margin: `0 0 16px` }}>
        {transactionError && <p>There was an error. Please try again later.</p>}
        {transactionLoading && <p>Writing message to chain...</p>}
        {transactionData && (
          <>
            <Text as="p">
              <Text as="small">
                <Link
                  href={
                    process.env.NEXT_PUBLIC_ETHERSCAN_URL +
                    `tx/` +
                    transactionData.transactionHash
                  }
                >
                  tx: {transactionData.transactionHash}
                </Link>
              </Text>
            </Text>
            <Text as="p">Message posted.</Text>
          </>
        )}
      </Box>
    );
  };

  return (
    <>
      {writeData ? (
        <Transaction hash={writeData.hash} />
      ) : (
        <>
          {tokenCount <= maxTokens && (
            <Button
              onClick={handleWriteWithMint}
              css={{ padding: `16px`, margin: `0 16px 16px 0` }}
            >
              <Text as="p">Write With Mint</Text>
            </Button>
          )}
          <Button
            onClick={handleWriteWithoutMint}
            css={{ padding: `16px`, margin: `0 16px 16px 0` }}
          >
            <Text as="p">Write Without Mint</Text>
          </Button>
        </>
      )}
      {writeLoading && (
        <Text as="p" css={{ margin: `0 0 16px` }}>
          Loading...
        </Text>
      )}
      {writeError && (
        <Text as="p" css={{ margin: `0 0 16px` }}>
          {writeError?.message}
        </Text>
      )}
    </>
  );
}
