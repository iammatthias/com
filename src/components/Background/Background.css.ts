// Background.css
// Language: typescript

// Scoped styles for `Background`.

import { recipe } from '@vanilla-extract/recipes';

import { atoms } from '@/styles/sprinkles.css';

export const backgroundRecipe = recipe({
  variants: {
    background: {
      noisy: [
        atoms({
          background: `bgGradient`,
        }),
        {
          position: `fixed`,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1,
          filter: `grayscale(1)`,
          backgroundAttachment: `fixed`,
        },
      ],
    },
  },
});

export type BackgroundVariants = Parameters<typeof backgroundRecipe>[0];