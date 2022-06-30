import { recipe } from '@vanilla-extract/recipes';

import { atoms } from '@/styles/sprinkles.css';

export const navigationRecipe = recipe({
  variants: {
    nav: {
      main: atoms({
        background: `black`,
        color: `white`,
        padding: 8,
        fontSize: 15,
        display: `flex`,
        alignItems: `center`,
        justifyContent: `space-between`,
      }),
      brand: atoms({
        display: `flex`,
        alignItems: `center`,
        justifyContent: `space-between`,
        gap: 16,
      }),
      menu: {
        position: `absolute`,
        display: `flex`,
        justifyContent: `center`,
        left: `0`,
        right: `0`,
        margin: `0 auto`,
        width: `100%`,
        maxWidth: `725px`,
      },
      menuIcon: {
        color: `white`,
      },
      menuList: {
        all: `unset`,
        display: `flex`,
        justifyContent: `center`,
        listStyle: `none`,
      },
      menuTrigger: {
        all: `unset`,
        display: `flex`,
        alignItems: `center`,
        justifyContent: `space-between`,
        padding: `8px 12px`,
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
        gap: `24px`,
        color: `black`,
        padding: 16,
      },
      menuPageList: {
        width: `100%`,
        display: `grid`,
        gap: `24px`,
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
        gap: 12,
      },
      menuViewport: {
        position: `relative`,
        transformOrigin: `top center`,

        overflow: `hidden`,
        height: `calc(var(--radix-navigation-menu-viewport-height) + 4px)`,
        border: `2px solid black`,
      },
      menuViewportPosition: {
        position: `absolute`,
        justifyContent: `center`,
        top: `29px`,
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
