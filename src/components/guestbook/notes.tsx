import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import React from 'react';

import Box from '@/components/box';
import Button from '@/components/button';
import Text from '@/components/text';

import { guestbookRecipe } from './guestbook.css';

export default function Notes() {
  const [open, setOpen] = React.useState(false);

  return (
    <CollapsiblePrimitive.Root
      open={open}
      onOpenChange={setOpen}
      className={guestbookRecipe({ guestbook: `collapsibleNotesWrapper` })}
    >
      <Box
        className={guestbookRecipe({ guestbook: `collapsibleNotesSubWrapper` })}
      >
        <Button kind="guestbook">
          <CollapsiblePrimitive.Trigger asChild>
            <div>FAQ {open ? `✗` : `↯`}</div>
          </CollapsiblePrimitive.Trigger>
        </Button>

        <CollapsiblePrimitive.Content>
          <Text as="ul" kind="ul">
            <Text as="li" kind="li" font="typewriter">
              Signing The Guestbook is free. Network gas fees apply.
            </Text>
            <Text as="li" kind="li" font="typewriter">
              For 0.01 Ξ you can mint an optional Guestbook NFT. Minting will
              issue a unique NFT derived from the connected wallet address.
            </Text>
            <Text as="li" kind="li" font="typewriter">
              There is a 280 character limit for guestlist messages.
            </Text>

            <Text as="li" kind="li" font="typewriter">
              An admin function exists for content moderation. Hateful or
              inflammatory content will be modified.
              <br />
              Please be kind ✌️
            </Text>
          </Text>
        </CollapsiblePrimitive.Content>
      </Box>
    </CollapsiblePrimitive.Root>
  );
}
