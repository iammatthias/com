import { ethers } from 'ethers';
import he from 'he';
import Link from 'next/link';
import { useState } from 'react';
import {
  useAccount,
  useBlockNumber,
  useContractWrite,
  useSigner,
  useWaitForTransaction,
} from 'wagmi';

import Box from '@/components/Box';
import Button from '@/components/button';
import Squiggle from '@/components/squiggle';
import Text from '@/components/text';
import abi from '@/utils/contract/abi.json';

import GuestENS from './ens';
import { guestbookRecipe } from './guestbook.css';

export default function Mint() {
  const contract = process.env.NEXT_PUBLIC_TARGET_CONTRACT_ADDRESS as string;

  const { data: signer } = useSigner();

  const { data: blockData } = useBlockNumber();
  const { address } = useAccount();

  const {
    data: writeWithMintData,
    isError: writeWithMintError,
    isLoading: writeWithMintLoading,
    reset: writeWithMintReset,
    write: writeWithMint,
  }: any = useContractWrite({
    addressOrName: contract,
    contractInterface: abi.abi,
    signerOrProvider: signer,
    functionName: `writeWithMint`,
  });

  const {
    data: writeWithoutMintData,
    isError: writeWithoutMintError,
    isLoading: writeWithoutMintLoading,
    reset: writeWithoutMintReset,
    write: writeWithoutMint,
  }: any = useContractWrite({
    addressOrName: contract,
    contractInterface: abi.abi,
    signerOrProvider: signer,
    functionName: `writeWithoutMint`,
  });

  const writeData = writeWithMintData || writeWithoutMintData;
  const writeError = writeWithMintError || writeWithoutMintError;
  const writeLoading = writeWithMintLoading || writeWithoutMintLoading;
  const writeReset = writeWithMintData
    ? writeWithMintReset
    : writeWithoutMintReset;

  const writeHash = writeData?.hash;

  const { data: transactionData } = useWaitForTransaction({
    hash: writeHash,
  });

  const [message, setMessage] = useState(``);

  const encodedMessage = he.encode(message ? message : `gm`);

  const handleWriteWithMint = async () => {
    await writeWithMint({
      args: encodedMessage,
      overrides: {
        value: ethers.utils.parseEther(`0.01`),
      },
    });
  };

  const handleWriteWithoutMint = async () => {
    await writeWithoutMint({
      args: encodedMessage,
    });
  };

  return (
    <>
      {!writeData && (
        <>
          <Box>
            {!writeError && !writeLoading && (
              <>
                <Button kind="guestbook" onClick={handleWriteWithoutMint}>
                  {writeLoading ? `Loading...` : `Write Message`}
                </Button>
                <Button kind="guestbook" onClick={handleWriteWithMint}>
                  {writeLoading
                    ? `Loading...`
                    : `Write Message & Mint | 0.01 Ξ`}
                </Button>
              </>
            )}
            {writeLoading && <>Loading...</>}
            {writeError && (
              <Button kind="guestbook" onClick={writeReset}>
                Error - Reset
              </Button>
            )}
          </Box>

          <form>
            <input
              id="message"
              placeholder="gm"
              onChange={(event) => setMessage(event.target.value)}
              className={guestbookRecipe({ guestbook: `input` })}
            />
          </form>
          {message && (
            <Box className={guestbookRecipe({ guestbook: `guestlistItem` })}>
              <Text as="h2" kind="h2" font="mono">
                Preview:
              </Text>
              <Squiggle squiggleWidth={8} height={24} />

              <Box className={guestbookRecipe({ guestbook: `guestlistMeta` })}>
                <Text as="p" kind="small" font="mono">
                  {address && (
                    <Link
                      href={
                        process.env.NEXT_PUBLIC_ETHERSCAN_URL +
                        `address/` +
                        address
                      }
                      passHref
                    >
                      <a>
                        <GuestENS address={address} />
                      </a>
                    </Link>
                  )}
                </Text>
                <Text as="p" kind="small" font="mono">
                  New Guest at{` `}
                  <i>{blockData}</i>
                </Text>
              </Box>
              <Text as="p" kind="p" font="mono">
                {message}
              </Text>
            </Box>
          )}
        </>
      )}
      {transactionData && (
        <>
          <Text>
            tx:
            {` `}
            <a
              href={`${process.env.NEXT_PUBLIC_ETHERSCAN_URL}tx/${transactionData.transactionHash}`}
            >
              {transactionData.transactionHash}
            </a>
          </Text>

          <Button kind="guestbook" onClick={writeReset}>
            Reset
          </Button>
        </>
      )}
    </>
  );
}
