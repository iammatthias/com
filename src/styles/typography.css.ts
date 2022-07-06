// typography.css.ts
// Language: typescript

// Typography styles + Capsize. See: https://github.com/bradwoods/boilerplate-nextjs-typography

import { FontMetrics } from '@capsizecss/core';
import interFontMetrics from '@capsizecss/metrics/inter';
import { createTextStyle } from '@capsizecss/vanilla-extract';
import { style } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';

interface Meta {
  fallback: string;
  files: {
    variable?: string;
    normal?: string;
    bold?: string;
  };
  format: string;
  metrics: FontMetrics;
  name: string;
  weights: {
    variable?: string;
    normal?: number;
    bold?: number;
  };
}

type FontFamilyId = 'INTER';

type Fonts = Record<FontFamilyId, Meta>;

const FONT_DIR = `/fonts`;

export const fonts: Fonts = {
  INTER: {
    fallback: `sans-serif`,
    files: {
      variable: `${FONT_DIR}/Inter-VariableFont_slnt,wght.ttf`,
    },
    format: `truetype-variations`,
    metrics: interFontMetrics,
    name: `Inter`,
    weights: {
      variable: `100 900`,
      normal: 400,
      bold: 700,
    },
  },
};

// https://type-scale.com
// Major Third
// base: 16
const typeScale = {
  s: 12.8,
  p: 16,
  h1: 48,
  h2: 39,
  h3: 31,
  h4: 25,
  h5: 20,
  h6: 16,
};

interface Props {
  id: FontFamilyId;
  leading: number;
  size: number;
}

function calcFontCss({ id, leading, size }: Props) {
  return style([
    createTextStyle({
      fontMetrics: fonts[id].metrics,
      fontSize: size,
      leading,
    }),
    {
      fontFamily: `"${fonts[id].name}", ${fonts[id].fallback}`,
    },
  ]);
}

export const fontStyles = recipe({
  variants: {
    kind: {
      p: [
        calcFontCss({
          id: `INTER`,
          leading: 24,
          size: typeScale.p,
        }),
      ],
      h1: [
        calcFontCss({
          id: `INTER`,
          leading: 25,
          size: typeScale.h1,
        }),
        { fontWeight: `bold` },
      ],
      h2: [
        calcFontCss({
          id: `INTER`,
          leading: 25,
          size: typeScale.h2,
        }),
        { fontWeight: `bold` },
      ],
      h3: [
        calcFontCss({
          id: `INTER`,
          leading: 25,
          size: typeScale.h3,
        }),
        { fontWeight: `bold` },
      ],
      h4: [
        calcFontCss({
          id: `INTER`,
          leading: 25,
          size: typeScale.h4,
        }),
        { fontWeight: `bold` },
      ],
      h5: [
        calcFontCss({
          id: `INTER`,
          leading: 25,
          size: typeScale.h5,
        }),
        { fontWeight: `bold` },
      ],
      h6: [
        calcFontCss({
          id: `INTER`,
          leading: 25,
          size: typeScale.h6,
        }),
        { fontWeight: `bold` },
      ],

      strong: {
        fontWeight: `bold`,
      },
      em: {
        fontStyle: `italic`,
      },
      small: {
        fontSize: typeScale.s,
      },
      span: {},
      pre: {},
      code: {},
      ul: {
        display: `grid`,
        gap: `8px`,
      },
      ol: {
        display: `grid`,
        gap: `8px`,
      },
      li: [
        calcFontCss({
          id: `INTER`,
          leading: 24,
          size: typeScale.p,
        }),
        {
          paddingLeft: `16px`,
          textIndent: `-16px`,
          display: `flex`,
          ':before': {
            content: `"⊙"`,
            marginRight: `24px`,
          },
        },
      ],
      blockquote: {
        padding: `8px 0 8px 16px`,
        borderLeft: `2px solid black`,
      },
      mono: {
        fontFamily: `monospace`,
      },
    },
  },
});

export type TextVariants = Parameters<typeof fontStyles>[0];

export const fontFiles = Object.values(fonts).flatMap((font) =>
  Object.values(font.files),
);
