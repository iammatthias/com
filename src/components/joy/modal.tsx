import React, { useState } from 'react';
import { styled, keyframes } from '@stitches/react';
import {
  Cross2Icon,
  TriangleLeftIcon,
  TriangleRightIcon,
} from '@radix-ui/react-icons';
import * as DialogPrimitive from '@radix-ui/react-dialog';

import { Box } from '../primitives/box';
import Image from 'next/image';
import { useHotkeys } from 'react-hotkeys-hook';

import { Button } from '../primitives/button';
import useMeasure from 'react-use-measure';

const overlayShow = keyframes({
  '0%': { opacity: 0 },
  '100%': { opacity: 1 },
});

const contentShow = keyframes({
  '0%': { opacity: 0 },
  '100%': { opacity: 1 },
});

const StyledOverlay = styled(DialogPrimitive.Overlay, {
  backgroundColor: `$faded`,
  backdropFilter: `blur(50px) saturate(618%)`,

  position: `fixed`,
  inset: 0,
  '@media (prefers-reduced-motion: no-preference)': {
    animation: `${overlayShow} 150ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
  },
  zi: `100`,
});

const StyledModal = styled(DialogPrimitive.Content, {
  backgroundColor: `$faded`,
  borderRadius: 6,
  boxShadow: `hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px`,
  position: `fixed`,
  top: `50%`,
  left: `50%`,
  transform: `translate(-50%, -50%)`,
  width: `100%`,
  height: `100%`,
  zIndex: `101`,
  '@media (prefers-reduced-motion: no-preference)': {
    animation: `${contentShow} 150ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
  },
  '&:focus': { outline: `none` },
});

const StyledContent = styled(`div`, {
  margin: `0 auto`,
  width: `auto`,
  maxWidth: `80%`,
  height: `100%`,
});

function Content({ children, ...props }: any) {
  return (
    <DialogPrimitive.Portal>
      <StyledOverlay />
      <StyledModal {...props}>
        <StyledContent>{children}</StyledContent>
      </StyledModal>
    </DialogPrimitive.Portal>
  );
}

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogContent = Content;
const DialogClose = DialogPrimitive.Close;

const ModalTrigger = styled(`button`, {
  padding: 0,
  margin: 0,
  border: 0,
  background: `transparent`,
  width: `100%`,
  '&:focus': { outline: `none` },
});

const IconButton = styled(`button`, {
  all: `unset`,
  fontFamily: `inherit`,
  borderRadius: `100%`,
  height: 25,
  width: 25,
  display: `inline-flex`,
  alignItems: `center`,
  justifyContent: `center`,
  color: `$primary`,
  position: `absolute`,
  top: 5,
  right: 5,
  '&:focus': { outline: `none` },
});

export default function Modal({ children, images, imageKey }: any) {
  const [ref, bounds] = useMeasure({ options: { offset: false } } as any);

  function contentfulLoader({ src, width, quality }: any) {
    return `${src}?w=${width || 1200}&q=${quality || 70}`;
  }

  const [i, setI] = useState(imageKey);

  const next = i + 1 == images.length ? i : i + 1;
  const prev = i - 1 == -1 ? 0 : i - 1;

  const image = images[i ? i : 0];

  useHotkeys(`left`, () => setI((i: any) => (i - 1 == -1 ? 0 : i - 1)), {
    enabled: true,
  });
  useHotkeys(
    `right`,
    () => setI((i: any) => (i + 1 == images.length ? i : i + 1)),
    {
      enabled: true,
    },
  );

  const showButtons = images.length > 1;

  const containerHeight = bounds?.height;

  const maxHeight = containerHeight * 0.8;
  const maxWidth = maxHeight * (image.width / image.height);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <ModalTrigger onClick={() => setI(imageKey)}>{children}</ModalTrigger>
      </DialogTrigger>
      <DialogContent>
        <Box
          ref={ref}
          css={{
            height: `100%`,
            width: `100%`,
            display: `flex`,
            flexDirection: `column`,
            alignItems: `center`,
            justifyContent: `center`,
          }}
        >
          <Box
            css={{
              position: `relative`,
              width: `100%`,
              height: `fit-content`,
              maxWidth: `${maxWidth}px`,
              maxHeight: `${maxHeight}px`,
              display: `flex`,
              alignContent: `center`,
              justifyContent: `center`,
            }}
          >
            <Image
              src={image.url}
              alt={image.title}
              // layout="responsive"
              placeholder="blur"
              blurDataURL={contentfulLoader({
                src: image.url,
                width: 5,
                quality: 1,
              })}
              width={image.width}
              height={image.height}
              className="gallery"
              loader={contentfulLoader}
            />
          </Box>
          <Box
            css={{
              display: `${showButtons ? `` : `none`}`,
              position: `absolute`,
              bottom: `100px`,
              width: `100%`,
              '@bp1': {
                bottom: `unset`,
                top: `50%`,
              },
              '@bp2': {
                bottom: `unset`,
                top: `50%`,
              },
            }}
          >
            <Button
              css={{
                position: `absolute`,
                left: `25px`,

                '@bp1': {
                  position: `relative`,
                },
                '@bp2': {
                  position: `relative`,
                },
                '@bp3': {
                  position: `absolute`,
                },
                '@bp4': {
                  position: `absolute`,
                },
              }}
              onClick={() => setI(prev)}
            >
              <TriangleLeftIcon />
            </Button>
            <Button
              css={{
                position: `absolute`,
                right: `25px`,
                '@bp1': {
                  position: `relative`,
                },
                '@bp2': {
                  position: `relative`,
                },
                '@bp3': {
                  position: `absolute`,
                },
                '@bp4': {
                  position: `absolute`,
                },
              }}
              onClick={() => setI(next)}
            >
              <TriangleRightIcon />
            </Button>
          </Box>
        </Box>

        <DialogClose asChild onClick={() => setI(imageKey)}>
          <Button
            css={{
              position: `absolute`,
              top: `25px`,
              right: `35px`,
            }}
          >
            <Cross2Icon />
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
