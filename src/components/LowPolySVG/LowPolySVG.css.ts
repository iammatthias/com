// LowPolySVG.css
// Language: typescript

// Scopeed styles for `LowPolySVG`.

import { recipe } from '@vanilla-extract/recipes';

export const lowPolySVGRecipe = recipe({
  variants: {
    LowPolySVG: {
      footer: [
        {
          height: `44px`,
          margin: `0 auto`,
          fill: `#131315`,
          marginTop: `auto`,
          marginBottom: `64px`,
        },
      ],
    },
  },
});

export type LowPolySVGVariants = Parameters<typeof lowPolySVGRecipe>[0];
