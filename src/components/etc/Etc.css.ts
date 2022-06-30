import { recipe } from '@vanilla-extract/recipes';

export const etcRecipe = recipe({
  variants: {
    etc: {
      squiggleContainer: [
        {
          width: `100%`,
          margin: `0 auto`,
          color: `black`,
        },
      ],
      squiggle: [
        {
          display: `block`,
          overflow: `visible`,
          textAlign: `center`,
          strokeWidth: `2`,
        },
      ],
    },
  },
});

export type EtcVariants = Parameters<typeof etcRecipe>[0];
