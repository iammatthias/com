import { recipe } from '@vanilla-extract/recipes';

export const layoutRecipe = recipe({
  variants: {
    layout: {
      list: {
        display: `grid`,
        gridTemplateColumns: `1fr`,
        gap: `16px`,
      },
      grid: {
        display: `grid`,

        gridTemplateColumns: `repeat(3, 1fr)`,
        gap: `16px`,
      },
      page: {
        display: `grid`,
        gap: `32px`,
      },
      pageContent: {
        display: `grid`,
        gap: `24px`,
        width: `100%`,
        maxWidth: `618px`,
        margin: `0 auto`,
        padding: `16px`,
      },
      homePageContent: {
        display: `flex`,
        flexDirection: `column`,
        flex: `1`,
        justifyContent: `center`,
        gap: `24px`,
        width: `100%`,
        height: `100%`,
        minHeight: `80vh`,
        maxWidth: `618px`,
        margin: `0 auto`,
        padding: `16px`,
      },
    },
  },
});

export type LayoutVariants = Parameters<typeof layoutRecipe>[0];
