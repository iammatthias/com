import { recipe } from '@vanilla-extract/recipes';

export const layoutRecipe = recipe({
  variants: {
    layout: {
      list: {
        display: `grid`,
        gridTemplateRows: `repeat(auto-fit, 1fr)`,
        gridTemplateColumns: `1fr`,
        gap: `16px`,
      },
      grid: {
        display: `grid`,
        gridTemplateRows: `repeat(auto-fit, 1fr)`,
        gridTemplateColumns: `repeat(3, 1fr)`,
        gap: `16px`,
      },
      page: {
        display: `grid`,
        grid: `auto 1fr auto`,
        gap: `32px`,
      },
    },
  },
});

export type LayoutVariants = Parameters<typeof layoutRecipe>[0];
