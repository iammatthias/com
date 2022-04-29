import { useRef, useState, useMemo } from 'react';
import { verifyMessage } from 'ethers/lib/utils';
import { useSignMessage } from 'wagmi';

import { Box } from '@/components/primitives/box';
import { Button } from '@/components/primitives/button';
import { Text } from '@/components/primitives/text';
import Link from 'next/link';

// import Ens from './ens'
import Squiggle from '../squiggle';
import Sparkle from '../sparkle';
import WriteMessage from './writeMessage';

export default function SignMessage() {
  // store message for preview

  const previousMessage: any = useRef;
  const [message, setMessage] = useState(``);
  const [signedData, setSignedData] = useState(``);

  const {
    data: signData,
    error: signError,
    isLoading: signLoading,
    signMessageAsync,
  } = useSignMessage();

  // store user for preview
  const recoveredAddress = useMemo(() => {
    if (!signData || !previousMessage.current) return undefined;
    return (
      setSignedData(signData), verifyMessage(previousMessage.current, signData)
    );
  }, [signData, previousMessage]);

  const handleReset = () => {
    setSignedData(``);
  };

  return (
    // conditionally display form or preview of message
    <>
      {signedData ? (
        // preview
        <>
          <WriteMessage message={previousMessage.current} />
          <Box
            css={{
              margin: `0 0 16px`,
              wordBreak: `break-word`,
            }}
          >
            <Sparkle>
              <Text as="p" css={{ margin: `0 0 8px` }}>
                <small>
                  <b>preview:</b>
                </small>
              </Text>
              <Squiggle />
              <Text as="p" css={{ margin: `0 0 8px` }}>
                <Text as="small">
                  <Link
                    href={
                      process.env.NEXT_PUBLIC_ETHERSCAN_URL +
                      `address/` +
                      recoveredAddress
                    }
                  >
                    {/* <Ens address={recoveredAddress} /> */}
                    {recoveredAddress}
                  </Link>
                </Text>
              </Text>
              <Text as="p" css={{ margin: `0 0 8px` }}>
                {previousMessage.current}
              </Text>
            </Sparkle>
          </Box>
          <Button
            onClick={handleReset}
            css={{ padding: `16px`, margin: `0 16px 16px 0` }}
          >
            <Text as="p">Reset</Text>
          </Button>
        </>
      ) : (
        // message submission form
        <form
          onSubmit={(event) => {
            event.preventDefault();
            previousMessage.current = message;

            signMessageAsync({ message: message });
          }}
          style={{ width: `100%` }}
        >
          <input
            id="message"
            placeholder="gm"
            onChange={(event) => setMessage(event.target.value)}
            style={{
              padding: `8px`,
              border: `solid 1px`,
              borderColor: `text`,
              borderRadius: `4px`,
              color: `text`,
              background: `transparent`,
              display: `block`,
              margin: `0 0 16px`,
              maxWidth: `361px`,
              width: `calc(100% - 16px)`,
            }}
          />
          {signLoading ? (
            <Text as="p">Sign the message in your wallet to preview.</Text>
          ) : (
            <Button
              disabled={signLoading || !message.length}
              css={{ padding: `16px`, margin: `0 16px 16px 0` }}
            >
              <Text as="p">Preview Message</Text>
            </Button>
          )}

          {signError && (
            <Text as="p">{signError?.message ?? `Error signing message`}</Text>
          )}
        </form>
      )}
    </>
  );
}
