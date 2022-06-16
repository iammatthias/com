import React from 'react';
import { styled } from '@stitches/react';
import { RowSpacingIcon, Cross2Icon } from '@radix-ui/react-icons';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { GuestbookText } from './guestbookText';

export default function Notes({ children }: any) {
  const [open, setOpen] = React.useState(false);

  const StyledCollapsible = styled(CollapsiblePrimitive.Root, {
    width: `calc(100% - 16px)`,
  });

  // Exports
  const Collapsible = StyledCollapsible;
  const CollapsibleTrigger = CollapsiblePrimitive.Trigger;
  const CollapsibleContent = CollapsiblePrimitive.Content;

  // Your app...
  const Flex = styled(`div`, { display: `flex` });

  const IconButton = styled(`button`, {
    all: `unset`,
    fontFamily: `inherit`,
    borderRadius: `100%`,
    height: 25,
    width: 25,
    display: `inline-flex`,
    alignItems: `center`,
    justifyContent: `center`,
    color: `$colors$primary`,
  });
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Flex css={{ alignItems: `start` }}>
        <GuestbookText>
          <b>
            <i>FAQ</i>
          </b>
        </GuestbookText>
        <CollapsibleTrigger asChild>
          <IconButton>{open ? <Cross2Icon /> : <RowSpacingIcon />}</IconButton>
        </CollapsibleTrigger>
      </Flex>

      <CollapsibleContent>
        <GuestbookText>{children}</GuestbookText>
      </CollapsibleContent>
    </Collapsible>
  );
}
