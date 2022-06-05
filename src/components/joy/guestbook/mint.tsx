import { useState } from 'react';
import { ethers } from 'ethers';
import {
  useContractWrite,
  useWaitForTransaction,
  useSigner,
  useBlockNumber,
  useAccount,
} from 'wagmi';
import abi from '@/lib/contract/abi.json';
import he from 'he';
import { Box } from '@/components/primitives/box';
import { Text } from '@/components/primitives/text';
import { GuestbookText } from './guestbookText';
import { GuestbookButton } from './guestbookButton';
import GuestENS from './guestEns';
import Sparkles from '../sparkle';
import Link from 'next/link';

export default function Mint() {
  const contract = process.env.NEXT_PUBLIC_TARGET_CONTRACT_ADDRESS as string;

  const { data: signer } = useSigner();

  const { data: blockData } = useBlockNumber();
  const { data: accountData } = useAccount();

  const {
    data: writeWithMintData,
    isError: writeWithMintError,
    isLoading: writeWithMintLoading,
    reset: writeWithMintReset,
    write: writeWithMint,
  }: any = useContractWrite(
    {
      addressOrName: contract,
      contractInterface: abi.abi,
      signerOrProvider: signer,
    },
    `signWithMint`,
  );

  const {
    data: writeWithoutMintData,
    isError: writeWithoutMintError,
    isLoading: writeWithoutMintLoading,
    reset: writeWithoutMintReset,
    write: writeWithoutMint,
  }: any = useContractWrite(
    {
      addressOrName: contract,
      contractInterface: abi.abi,
      signerOrProvider: signer,
    },
    `signWithoutMint`,
  );

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
    <Box css={{ margin: `16px 0` }}>
      {!writeData && (
        <>
          <Box css={{ margin: `0 0 16px` }}>
            {!writeError && !writeLoading && (
              <>
                <GuestbookButton onClick={handleWriteWithoutMint}>
                  {writeLoading ? `Loading...` : `Write Message`}
                </GuestbookButton>
                <GuestbookButton onClick={handleWriteWithMint}>
                  {writeLoading
                    ? `Loading...`
                    : `Write Message & Mint | 0.01 Ξ`}
                </GuestbookButton>
              </>
            )}
            {writeLoading && <>Loading...</>}
            {writeError && (
              <GuestbookButton onClick={writeReset}>
                Error - Reset
              </GuestbookButton>
            )}
          </Box>
          <Box>
            <form>
              <input
                id="message"
                placeholder="gm"
                onChange={(event) => setMessage(event.target.value)}
                style={{
                  padding: `8px`,
                  border: `solid 1px`,
                  borderColor: `text`,
                  color: `text`,
                  background: `transparent`,
                  display: `block`,
                  margin: `0 0 16px`,
                  maxWidth: `400px`,
                  width: `calc(100% - 16px)`,
                }}
              />
            </form>
            {message && (
              <Sparkles>
                <Text>
                  <b>
                    <i>Preview:</i>
                  </b>
                </Text>
                <Box css={{ width: `fit-content`, margin: `0 0 16px` }}>
                  <GuestbookText
                    as="p"
                    css={{ margin: `8px 0`, wordBreak: `break-word` }}
                  >
                    <GuestbookText as="small">
                      {accountData && (
                        <Link
                          href={
                            process.env.NEXT_PUBLIC_ETHERSCAN_URL +
                            `address/` +
                            accountData.address
                          }
                          passHref
                        >
                          <GuestENS address={accountData.address} />
                        </Link>
                      )}
                    </GuestbookText>
                  </GuestbookText>
                  <GuestbookText as="p" css={{ margin: `8px 0` }}>
                    {message}
                  </GuestbookText>
                  <GuestbookText as="p" css={{ margin: `8px 0` }}>
                    <GuestbookText as="small">
                      at{` `}
                      <i>{blockData}</i>
                    </GuestbookText>
                  </GuestbookText>
                </Box>
              </Sparkles>
            )}
          </Box>
        </>
      )}
      {transactionData && (
        <>
          <GuestbookText>
            tx:
            {` `}
            <a
              href={`${process.env.NEXT_PUBLIC_ETHERSCAN_URL}tx/${transactionData.transactionHash}`}
            >
              {transactionData.transactionHash}
            </a>
          </GuestbookText>

          <Box css={{ width: `100%`, display: `flex`, alignContent: `center` }}>
            <GuestbookButton onClick={writeReset}>Reset</GuestbookButton>
          </Box>
        </>
      )}
    </Box>
  );
}
