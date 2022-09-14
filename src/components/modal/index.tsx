import * as DialogPrimitive from '@radix-ui/react-dialog';
import Image from 'next/image';
import React, { useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import useMeasure from 'react-use-measure';

import Box from '@/components/box';

import { modalRecipe } from './modal.css';

function Content({ children, ...props }: any) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={modalRecipe({ modal: `overlay` })} />
      <DialogPrimitive.Content
        {...props}
        className={modalRecipe({ modal: `contentWrapper` })}
      >
        <Box className={modalRecipe({ modal: `content` })}>{children}</Box>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export default function Modal({ children, images, imageKey }: any) {
  const [ref, bounds] = useMeasure({ options: { offset: false } } as any);

  function contentfulLoader({ src, width, quality }: any) {
    return `${src}?w=${width || 1200}&q=${quality || 60}`;
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
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger
        asChild
        className={modalRecipe({ modal: `trigger` })}
      >
        <Box
          onClick={() => setI(imageKey)}
          className="umami--click--Modal-Opened"
        >
          {children}
        </Box>
      </DialogPrimitive.Trigger>

      <Content>
        <div ref={ref} className={modalRecipe({ modal: `measure` })}>
          <Image
            src={image.url}
            alt={image.title}
            layout="intrinsic"
            height={
              image.contentType === `image/svg+xml` ? maxHeight : maxHeight
            }
            width={image.contentType === `image/svg+xml` ? maxHeight : maxWidth}
            placeholder="blur"
            blurDataURL={contentfulLoader({
              src: image.url,
              width: 5,
              quality: 1,
            })}
            objectFit="cover"
            loader={contentfulLoader}
          />
        </div>
        {showButtons && (
          <Box className={modalRecipe({ modal: `modalNav` })}>
            <Box
              onClick={() => setI(prev)}
              className={modalRecipe({ modal: `modalIcon` })}
            >
              ←
            </Box>
            <Box
              onClick={() => setI(next)}
              className={modalRecipe({ modal: `modalIcon` })}
            >
              →
            </Box>
          </Box>
        )}
        <Box className={modalRecipe({ modal: `close` })}>
          <DialogPrimitive.Close
            asChild
            onClick={() => setI(imageKey)}
            className="umami--click--Modal-Closed"
          >
            ✗
          </DialogPrimitive.Close>
        </Box>
      </Content>
    </DialogPrimitive.Root>
  );
}
