import { recipe } from '@vanilla-extract/recipes';

export const lowPolySVGRecipe = recipe({
  variants: {
    LowPolySVG: {
      footer: [
        {
          position: `absolute`,
          left: 0,
          right: 0,
          bottom: 64,
          zIndex: 1,
          // filter: `grayscale(1)`,
          height: `44px`,
          margin: `0 auto`,
          fill: `#131315`,
        },
      ],
    },
  },
});

export type LowPolySVGVariants = Parameters<typeof lowPolySVGRecipe>[0];
