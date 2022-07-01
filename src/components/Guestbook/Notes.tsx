import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { Cross2Icon, RowSpacingIcon } from '@radix-ui/react-icons';
import React from 'react';

import Box from '@/components/Box';
import Button from '@/components/Button';
import Text from '@/components/Text';

import { guestbookRecipe } from './Guestbook.css';

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
        <Text as="h1" kind="mono">
          <Text as="strong" kind="strong">
            <Text as="em" kind="em">
              FAQ
            </Text>
          </Text>
        </Text>
        <CollapsiblePrimitive.Trigger asChild>
          <Button kind="icon">
            {open ? <Cross2Icon /> : <RowSpacingIcon />}
          </Button>
        </CollapsiblePrimitive.Trigger>
      </Box>

      <CollapsiblePrimitive.Content>
        <Text as="ul" kind="ul">
          <Text as="li" kind="li">
            Signing the guestbook is free, but gas fees will apply.
          </Text>
          <Text as="li" kind="li">
            Minting the NFT is optional, and costs 0.01 Ξ.
          </Text>
          <Text as="li" kind="li">
            Minting will issue a unique NFT customized with colors derived from
            your ETH address.
          </Text>
          <Text as="li" kind="li">
            There is a 280 character limit for guestlist messages.
          </Text>
          <Text as="li" kind="li">
            An admin function exists for content moderation. In the case of
            inflammatory, hateful, or otherwise inappropriate content, the
            message can be replaced with &quot;gm&quot; (or something similar).
            <br />
            <br />
            This is not an act that would happen lightly. This project is meant
            to be exist as a form of friendly engagement with the community.
            <br />
            <br />
            Please be kind ✌️
          </Text>
        </Text>
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  );
}
