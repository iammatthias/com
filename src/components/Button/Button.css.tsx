// Button.css
// Language: typescript

// Scoped styles for `Button`.

import { recipe } from '@vanilla-extract/recipes';

import { atoms } from '@/styles/sprinkles.css';

export const buttonRecipe = recipe({
  variants: {
    kind: {
      primary: atoms({ background: `overlay`, color: `black` }),
      secondary: atoms({ background: `white`, color: `black` }),
      modalLeft: atoms({ background: `overlay`, color: `black` }),
      modalRight: atoms({ background: `overlay`, color: `black` }),
      thought: {
        lineHeight: `15px`,
        height: `fit-content`,
        padding: `0`,
      },
      icon: {
        all: `unset`,
        fontFamily: `inherit`,
        borderRadius: `100%`,
        height: 25,
        width: 25,
        display: `inline-flex`,
        alignItems: `center`,
        justifyContent: `center`,
        color: `black`,
      },
      guestbook: {
        margin: `0 16px 0 0`,
        background: `var(--rk-colors-connectButtonBackground)`,
        width: `fit-content`,
        padding: `8px`,
        borderRadius: `var(--rk-radii-connectButton)`,
        border: `2px solid var(--rk-colors-connectButtonBackground)`,
        boxShadow: `var(--rk-shadows-connectButton)`,
        fontFamily: `var(--rk-fonts-body)`,
        fontSize: `16px`,
        fontWeight: `700`,

        color: `var(--rk-colors-connectButtonText)`,
        '&:hover': {
          transform: `scale(1.025)`,
        },
      },
    },
  },
});

export type ButtonVariants = Parameters<typeof buttonRecipe>[0];
