import React from 'react';
import { figure, textRecipe, TextVariants } from '@/components/text/text.css';
import Box from '@/components/box';

type Props = {
  children: React.ReactNode;
  as?: React.ElementType;
  href?: string;
  figcaption?: string;
  className?: string;
} & TextVariants;

export default function Text({
  as = `p`,
  kind = `p`,
  font = `body`,
  bold = false,
  italic = false,
  highlight = false,
  navBar = false,
  mono = false,
  center = false,
  href = ``,
  figcaption = ``,
  className = ``,
  children,
}: Props) {
  if (as === `blockquote`) {
    return (
      <Box as="figure" className={`${figure}`}>
        <Box
          as={as}
          className={textRecipe({
            font,
            kind,
            bold,
            italic,

            highlight,
            navBar,
            mono,
            center,
          })}
          href={href}
        >
          {children}
        </Box>
        {figcaption && (
          <Box
            as="figcaption"
            className={textRecipe({
              font,
              kind: `small`,
              bold: true,
              italic: true,
            })}
          >
            ———{figcaption}
          </Box>
        )}
      </Box>
    );
  } else
    return (
      <Box
        as={as}
        className={`${textRecipe({
          font,
          kind,
          bold,
          italic,

          highlight,
          navBar,
          mono,
          center,
        })} ${className}`}
        href={href}
      >
        {children}
      </Box>
    );
}
