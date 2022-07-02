// NavigationMenu.css
// Language: typescript

// Scoped styles for `NavigationMenu`.

import { recipe } from '@vanilla-extract/recipes';

import { atoms } from '@/styles/sprinkles.css';

export const navigationRecipe = recipe({
  variants: {
    nav: {
      mainWrapper: [
        atoms({
          paddingLeft: `safeLeft`,
          paddingRight: `safeRight`,
          background: `black`,
          display: `flex`,
          alignItems: `center`,
        }),
        {
          width: `100%`,
        },
      ],
      main: [
        atoms({
          color: `white`,
          padding: 12,
          fontSize: 15,
          display: `flex`,
          alignItems: `center`,
          justifyContent: `space-between`,
        }),
        {
          height: 54,
          width: `100%`,
        },
      ],
      brand: atoms({
        display: `flex`,
        alignItems: `center`,
        justifyContent: `space-between`,
        gap: 16,
      }),
      title: atoms({
        display: {
          mobile: `none`,
          tablet: `block`,
        },
      }),
      menu: {
        position: `absolute`,
        display: `flex`,
        alignItems: `center`,
        justifyContent: `center`,
        left: `0`,
        right: `0`,
        margin: `0 auto`,
        width: `100%`,
        height: 30,
        maxWidth: `725px`,
        overflow: `show`,
      },
      menuIcon: {
        color: `white`,
        height: `28px`,
        width: `28px`,
        padding: 4,
        outline: `1px solid white`,

        ':hover': {
          outline: `2px solid white`,
        },
      },
      menuList: {
        all: `unset`,
        display: `flex`,
        justifyContent: `center`,
        listStyle: `none`,
        gap: `32px`,
      },
      menuTrigger: {
        all: `unset`,
        display: `flex`,
        alignItems: `center`,
        justifyContent: `space-between`,

        outline: `none`,
        userSelect: `none`,
        fontWeight: 500,
        lineHeight: 1,
        fontSize: 15,
        color: `black`,
      },
      menuContent: {
        width: `100%`,
        backdropFilter: `blur(50px) saturate(382%) grayscale(50%) brightness(1.35)`,
        display: `grid`,
        gap: `16px`,
        color: `black`,
        padding: 16,
      },
      menuPageList: {
        width: `100%`,
        display: `grid`,
        gap: `16px`,
        gridTemplateColumns: `repeat(3, 1fr)`,
      },
      menuItem: {
        flexBasis: `30%`,
        borderTop: `2px solid black`,
        paddingTop: 12,
        paddingBottom: 12,
        paddingLeft: 8,
        paddingRight: 8,
        display: `grid`,
        gap: `16px`,
      },
      menuViewport: {
        position: `relative`,
        transformOrigin: `top center`,

        overflow: `hidden`,
        height: `calc(var(--radix-navigation-menu-viewport-height) + 4px)`,
        border: `2px solid black`,
        marginBottom: 64,
      },
      menuViewportPosition: {
        position: `absolute`,
        justifyContent: `center`,
        top: `36px`,
        perspective: `2000px`,
        width: `100%`,
        maxWidth: `725px`,
        padding: `0 16px`,
        zIndex: 10,
      },
    },
  },
});

export type NavigationVariants = Parameters<typeof navigationRecipe>[0];
