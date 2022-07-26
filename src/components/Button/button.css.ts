// Button.css
// Language: typescript

// Scoped styles for `Button`.

import { recipe } from '@vanilla-extract/recipes';

export const buttonRecipe = recipe({
  variants: {
    kind: {
      primary: {
        paddingTop: 8,
        paddingBottom: 8,
        paddingLeft: 16,
        paddingRight: 16,
        border: `none`,
        textDecoration: `none`,
        verticalAlign: `middle`,
        background: `transparent`,
        boxShadow: `0 0 0 1px black`,
        backdropFilter: `blur(50px) opacity(38.2%) saturate(2618%)`,
        color: `black`,
        ':hover': {
          boxShadow: `0 0 0 2px black`,
        },
        ':focus': { outline: `none` },
      },
      secondary: { background: `white`, color: `black` },
      modalLeft: { background: `overlay`, color: `black` },
      modalRight: { background: `overlay`, color: `black` },

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
        ':hover': {
          transform: `scale(1.025)`,
        },
      },
    },
  },
});

export type ButtonVariants = Parameters<typeof buttonRecipe>[0];
