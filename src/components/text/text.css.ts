import { recipe } from '@vanilla-extract/recipes';
import { atoms } from '@/styles/atoms.css';

export const figure = atoms({
  padding: `16`,
  borderStyle: `solid`,
  borderWidth: `2`,
  borderColor: `black`,
  display: `flex`,
  flexDirection: `column`,
  gap: `8`,
});

export const textRecipe = recipe({
  variants: {
    font: {
      body: [
        atoms({ fontFamily: `GT-A` }),
        {
          fontVariationSettings: `"wght" 200, "wdth" 0, "DISP" 0`,
          lineHeight: `1.382`,
        },
      ],
      heading: [
        atoms({ fontFamily: `GT-A` }),
        {
          fontVariationSettings: `"wght" 700, "wdth" 1000, "DISP" 1000`,
        },
      ],
      typewriter: [
        atoms({ fontFamily: `GT-A Mono` }),
        {
          fontVariationSettings: `"wght" 200, "wdth" 0, "DISP" 0`,
        },
      ],
      mono: atoms({ fontFamily: `monospace` }),
    },
    kind: {
      p: atoms({
        fontSize: { mobile: `mobile-p`, tablet: `tablet-p` },
      }),
      h1: atoms({
        fontSize: { mobile: `mobile-h1`, tablet: `tablet-h1` },
      }),
      h2: atoms({
        fontSize: { mobile: `mobile-h2`, tablet: `tablet-h2` },
      }),
      h3: atoms({
        fontSize: { mobile: `mobile-h3`, tablet: `tablet-h3` },
      }),
      h4: atoms({
        fontSize: { mobile: `mobile-h4`, tablet: `tablet-h4` },
      }),
      h5: atoms({
        fontSize: { mobile: `mobile-h5`, tablet: `tablet-h5` },
      }),
      h6: atoms({
        fontSize: { mobile: `mobile-h6`, tablet: `tablet-h6` },
      }),
      small: atoms({
        fontSize: { mobile: `mobile-small`, tablet: `tablet-small` },
      }),
      xsmall: atoms({
        fontSize: { mobile: `mobile-xsmall`, tablet: `tablet-xsmall` },
      }),
      span: {
        fontSize: `inherit`,
        lineHeight: `inherit`,
        fontWeight: `inherit`,
        fontFamily: `inherit`,
        color: `inherit`,
      },
      pre: [
        atoms({
          background: `black`,
          color: `white`,
          fontSize: { mobile: `mobile-small`, tablet: `tablet-small` },
        }),
        {
          whiteSpace: `pre-wrap`,
          padding: 16,
          borderTop: `2px solid black`,
        },
      ],
      code: [
        atoms({
          fontSize: { mobile: `mobile-small`, tablet: `tablet-small` },
        }),
        {
          border: `2px solid black`,
          padding: `0 2px`,
          selectors: {
            'pre &': {
              border: `none`,
              background: `none`,
              padding: 0,
            },
          },
        },
      ],
      ul: {
        display: `grid`,
        gap: `8px`,
      },
      ol: {
        display: `grid`,
        gap: `8px`,
      },
      li: [
        {
          paddingLeft: `16px`,
          textIndent: `-16px`,
          display: `flex`,
          ':before': {
            content: `"⊙"`,
            marginRight: `24px`,
          },
        },
        atoms({
          fontSize: { mobile: `mobile-small`, tablet: `tablet-small` },
        }),
      ],

      blockquote: {
        // Wrapped in a figure to include caption
        // See `figure` styles above
      },
      strong: atoms({
        fontWeight: `700`,
      }),
      b: atoms({
        fontWeight: `700`,
      }),
      em: atoms({
        fontStyle: `italic`,
      }),
      i: atoms({
        fontStyle: `italic`,
      }),
      guestbookHeader: atoms({
        fontSize: { mobile: `root`, tablet: `tablet-p` },
      }),
    },
    bold: {
      true: {
        fontVariationSettings: `"wght" 700`,
      },
    },
    italic: {
      true: atoms({
        fontStyle: `italic`,
      }),
    },

    highlight: {
      true: atoms({ background: `highlight`, paddingX: `2` }),
    },
    center: {
      true: {
        margin: `0 auto`,
        textAlign: `center`,
      },
    },
    navBar: {
      true: [
        atoms({
          fontSize: { mobile: `mobile-xsmall`, tablet: `tablet-xsmall` },
        }),
      ],
    },
    monospace: {
      true: {
        fontFamily: `monospace`,
      },
    },
    singleLineHeight: {
      true: {
        lineHeight: `1`,
      },
    },
  },
});

export type TextVariants = Parameters<typeof textRecipe>[0];
