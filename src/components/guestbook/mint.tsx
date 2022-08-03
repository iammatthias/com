import { ethers } from 'ethers';
import he from 'he';
import Link from 'next/link';
import { useState } from 'react';
import {
  useAccount,
  useBlockNumber,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from 'wagmi';

import { useIsMounted } from '@/utils/useIsMounted';

import Box from '@/components/Box';
import Button from '@/components/button';
import Squiggle from '@/components/squiggle';
import Text from '@/components/text';
import abi from '@/utils/contract/abi.json';

import GuestENS from './ens';
import { guestbookRecipe } from './guestbook.css';

export default function Mint() {
  const contract = process.env.NEXT_PUBLIC_TARGET_CONTRACT_ADDRESS as string;

  const { data: blockData } = useBlockNumber();
  const { address } = useAccount();

  const isMounted = useIsMounted();

  const [message, setMessage] = useState(``);

  const encodedMessage = he.encode(message ? message : `gm`);

  // write with mint
  const { config: writeWithMintConfig } = usePrepareContractWrite({
    addressOrName: contract,
    contractInterface: abi.abi,
    functionName: `signWithMint`,
    args: [encodedMessage],
    overrides: {
      value: ethers.utils.parseEther(`0.01`),
    },
  });

  const {
    data: writeWithMintData,
    isError: writeWithMintError,
    isLoading: writeWithMintLoading,
    reset: writeWithMintReset,
    write: writeWithMint,
  } = useContractWrite(writeWithMintConfig);

  // write without mint
  const { config: writeWithoutMintConfig } = usePrepareContractWrite({
    addressOrName: contract,
    contractInterface: abi.abi,
    functionName: `signWithoutMint`,
    args: [encodedMessage],
  });

  const {
    data: writeWithoutMintData,
    isError: writeWithoutMintError,
    isLoading: writeWithoutMintLoading,
    reset: writeWithoutMintReset,
    write: writeWithoutMint,
  } = useContractWrite(writeWithoutMintConfig);

  // set consts
  const writeData = writeWithMintData || writeWithoutMintData;
  const writeError = writeWithMintError || writeWithoutMintError;
  const writeLoading = writeWithMintLoading || writeWithoutMintLoading;
  const writeReset = writeWithMintData
    ? writeWithMintReset
    : writeWithoutMintReset;

  const showButtons = !writeError && !writeLoading;

  // transaction data
  const { data: transactionData } = useWaitForTransaction({
    hash: writeData?.hash,
  });

  return isMounted() ? (
    <>
      {!writeData && (
        <>
          <Box as="div">
            {showButtons && (
              <Box as="div">
                <Button kind="guestbook" onClick={writeWithoutMint}>
                  Write Message
                </Button>
                <Button kind="guestbook" onClick={writeWithMint}>
                  Write Message & Mint | 0.01 Ξ
                </Button>
              </Box>
            )}
            {writeLoading && <>Loading...</>}
            {writeError && (
              <Button kind="guestbook" onClick={writeReset}>
                Canceled - Click to Reset
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
            <Box
              as="div"
              className={guestbookRecipe({ guestbook: `guestlistItem` })}
            >
              <Text as="h2" kind="h2" font="mono">
                Preview:
              </Text>
              <Squiggle squiggleWidth={8} height={24} />

              <Box
                as="div"
                className={guestbookRecipe({ guestbook: `guestlistMeta` })}
              >
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
                  <i>{blockData && blockData}</i>
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
  ) : null;
}
