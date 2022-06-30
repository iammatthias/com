import { recipe } from '@vanilla-extract/recipes';

import { atoms } from '@/styles/sprinkles.css';

export const buttonRecipe = recipe({
  variants: {
    kind: {
      primary: atoms({ background: `overlay`, color: `black` }),
      secondary: atoms({ background: `white`, color: `black` }),
      modalLeft: atoms({ background: `overlay`, color: `black` }),
      modalRight: atoms({ background: `overlay`, color: `black` }),
    },
  },
});

export type ButtonVariants = Parameters<typeof buttonRecipe>[0];
