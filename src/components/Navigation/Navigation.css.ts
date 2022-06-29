import { recipe } from '@vanilla-extract/recipes';
import { atoms } from '@/styles/sprinkles.css';

export const navigationRecipe = recipe({
  variants: {
    nav: {
      main: {
        background: `black`,
        color: `white`,
        padding: 8,
        fontSize: `15px`,
        display: `flex`,
        alignItems: `center`,
        justifyContent: `space-between`,
      },
      menu: {
        position: `absolute`,
        display: `flex`,
        justifyContent: `center`,
        left: `0`,
        right: `0`,
        margin: `0 auto`,
        width: `80%`,
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
        '&:focus': { position: `relative`, background: `black` },
        '&:hover': {
          background: `$colors$faded`,
        },
      },
      menuContent: {
        width: `100%`,
        backdropFilter: `blur(50px) saturate(382%)`,
        display: `flex`,
        flexDirection: `row`,
        flexWrap: `wrap`,
        gap: 16,
        padding: `16px`,
      },
      menuItem: {
        flex: `1 1 30%`,
      },
      menuViewport: {
        position: `relative`,
        transformOrigin: `top center`,
        width: `100%`,
        overflow: `hidden`,
        height: `calc(var(--radix-navigation-menu-viewport-height) + 4px)`,
        border: `2px solid black`,
      },
      menuViewportPosition: {
        position: `absolute`,
        justifyContent: `center`,
        top: `100%`,
        perspective: `2000px`,
      },
    },
  },
});

export type NavigationVariants = Parameters<typeof navigationRecipe>[0];
