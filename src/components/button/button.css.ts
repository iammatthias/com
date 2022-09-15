// Button.css
// Language: typescript

// Scoped styles for `Button`.

import { atoms } from '@/styles/atoms.css';
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
      guestbook: [
        atoms({
          background: `black`,
          color: `white`,
          fontFamily: `GT-A Mono`,
        }),
        {
          margin: `0 16px 0 0`,
          padding: `8px 16px`,
          width: `fit-content`,
          border: `none`,
          fontSize: `18px`,
          fontWeight: `200`,
          ':hover': {
            transform: `scale(1.025)`,
          },
        },
      ],
    },
  },
});

export type ButtonVariants = Parameters<typeof buttonRecipe>[0];
