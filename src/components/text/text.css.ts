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
      body: atoms({ fontFamily: `GT-A` }),
      heading: atoms({ fontFamily: `GT-A` }),
      mono: atoms({ fontFamily: `GT-A Mono` }),
    },
    kind: {
      p: [
        atoms({
          fontSize: `p`,
        }),
        {
          fontVariationSettings: `"wght" 200, "wdth" 0, "DISP" 0`,
          lineHeight: `1.382`,
        },
      ],
      h1: [
        atoms({
          fontSize: `h1`,
        }),
        {
          fontVariationSettings: `"wght" 700, "wdth" 1000, "DISP" 1000`,
        },
      ],
      h2: [
        atoms({
          fontSize: `h2`,
        }),
        {
          fontVariationSettings: `"wght" 700, "wdth" 1000, "DISP" 1000`,
        },
      ],
      h3: [
        atoms({
          fontSize: `h3`,
        }),
        {
          fontVariationSettings: `"wght" 700, "wdth" 1000, "DISP" 1000`,
        },
      ],
      h4: [
        atoms({
          fontSize: `h4`,
        }),
        {
          fontVariationSettings: `"wght" 700, "wdth" 1000, "DISP" 1000`,
        },
      ],
      h5: [
        atoms({
          fontSize: `h5`,
        }),
        {
          fontVariationSettings: `"wght" 700, "wdth" 1000, "DISP" 1000`,
        },
      ],
      h6: [
        atoms({
          fontSize: `h6`,
        }),
        {
          fontVariationSettings: `"wght" 700, "wdth" 1000, "DISP" 1000`,
        },
      ],
      small: atoms({ fontSize: `small` }),
      xsmall: atoms({ fontSize: `disclaimer` }),
      span: {},
      pre: [
        atoms({
          background: `black`,
          color: `white`,
        }),
        {
          fontSize: `12px`,
          whiteSpace: `pre-wrap`,
          padding: 16,
          borderTop: `2px solid black`,
          // fontVariationSettings: `"wght" 400, "CASL" 0, "slnt" 0, "MONO" 1, "CRSV" 0`,
        },
      ],
      code: {
        border: `2px solid black`,
        fontSize: `12px`,
        padding: `2px`,
        selectors: {
          'pre &': {
            border: `none`,
            background: `none`,
            padding: 0,
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

      blockquote: {
        // Wrapped in a figure to include caption
        // See `figure` styles above
      },
      strong: atoms({
        fontWeight: `900`,
      }),
      b: atoms({
        fontWeight: `900`,
      }),
      em: atoms({
        fontStyle: `italic`,
      }),
      i: atoms({
        fontStyle: `italic`,
      }),
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
        {
          fontFamily: `GT-A Mono`,
          fontVariationSettings: `"wght" 200, "wdth" 0, "DISP" 0`,
        },
        atoms({
          fontSize: `disclaimer`,
        }),
      ],
    },
    mono: {
      true: {
        fontFamily: `GT-A Mono`,
        fontVariationSettings: `"wght" 200, "wdth" 0, "DISP" 0`,
      },
    },
  },
});

export type TextVariants = Parameters<typeof textRecipe>[0];
