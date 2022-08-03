import { recipe } from '@vanilla-extract/recipes';
import { atoms } from '@/styles/sprinkles.css';

export const textRecipe = recipe({
  variants: {
    font: {
      body: atoms({ fontFamily: `Inter` }),
      heading: atoms({ fontFamily: `Losta Bonita` }),
      mono: atoms({ fontFamily: `monospace` }),
    },
    kind: {
      p: atoms({
        fontSize: `p`,
        color: `black`,
      }),
      h1: atoms({
        fontSize: `h1`,
        color: `black`,
      }),
      h2: atoms({
        fontSize: `h2`,
        color: `black`,
      }),
      h3: atoms({
        fontSize: `h3`,
        color: `black`,
      }),
      h4: atoms({
        fontSize: `h4`,
        color: `black`,
      }),
      h5: atoms({ fontSize: `h5`, color: `black` }),
      h6: atoms({ fontSize: `h6`, color: `black` }),
      small: atoms({ fontSize: `small`, color: `black` }),
      span: {},
      pre: {
        whiteSpace: `pre-wrap`,
        paddingTop: 8,
        paddingLeft: 8,
        paddingRight: 8,
        borderTop: `2px solid black`,
      },
      code: {
        paddingRight: 2,
        paddingLeft: 2,
        border: `2px solid black`,
        fontSize: `13px`,
        selectors: {
          'pre &': {
            border: `none`,
          },
        },
      },
      ul: {
        display: `grid`,
        gap: `8px`,
      },
      ol: {
        display: `grid`,
        gap: `8px`,
      },
      li: {
        paddingLeft: `16px`,
        textIndent: `-16px`,
        display: `flex`,

        ':before': {
          content: `"⊙"`,
          marginRight: `24px`,
        },
      },
      blockquote: [
        {
          padding: `8px 0 8px 16px`,
          borderLeft: `2px solid black`,
          selectors: {
            '&:nth-child(n)': {
              fontFamily: `Inconsolata`,
            },
          },
        },
      ],
    },
    bold: {
      true: atoms({
        fontWeight: `900`,
      }),
    },
    italic: {
      true: atoms({
        fontStyle: `italic`,
      }),
    },
  },
});

export type TextVariants = Parameters<typeof textRecipe>[0];
