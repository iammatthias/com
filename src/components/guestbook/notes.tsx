import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { Cross2Icon, RowSpacingIcon } from '@radix-ui/react-icons';
import React from 'react';

import Box from '@/components/Box';
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
        <Text as="h1" kind="p" font="mono" bold={true} italic={true}>
          FAQ
        </Text>
        <CollapsiblePrimitive.Trigger asChild>
          <Button kind="icon">
            {open ? <Cross2Icon /> : <RowSpacingIcon />}
          </Button>
        </CollapsiblePrimitive.Trigger>
      </Box>

      <CollapsiblePrimitive.Content>
        <Text as="ul" kind="ul">
          <Text as="li" kind="li" font="mono">
            Gas fees apply.
          </Text>
          <Text as="li" kind="li" font="mono">
            Signing the Guestbook is free. For 0.01 Ξ you can mint an optional
            Guestbook NFT.
          </Text>
          <Text as="li" kind="li" font="mono">
            Minting will issue a unique NFT customized with colors derived from
            your ETH address.
          </Text>
          <Text as="li" kind="li" font="mono">
            There is a 280 character limit for guestlist messages.
          </Text>
          <Text as="li" kind="li" font="mono">
            An admin function exists for content moderation. In the case of
            inflammatory, hateful, or otherwise inappropriate content, the
            message can be replaced with &quot;gm&quot; (or something similar).
            <br />
            <br />
            Please be kind ✌️
          </Text>
        </Text>
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  );
}
