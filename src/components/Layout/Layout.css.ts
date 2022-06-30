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
        display: `flex`,
        flexDirection: `column`,
        gap: `32px`,
        minHeight: `calc(100vh - 64px)`,
      },
      pageContent: {
        flexGrow: 1,
        display: `flex`,
        flexDirection: `column`,
        justifyContent: `center`,
        gap: `24px`,
        width: `100%`,
        maxWidth: `725px`,
        margin: `0 auto`,
        padding: `16px`,
      },
      galleryWrapper: {
        position: `relative`,
        width: `100%`,
        marginBottom: `8px`,
      },
      galleryImage: {
        position: `relative`,
        width: `100%`,
        marginBottom: `8px`,
      },
    },
  },
});

export type LayoutVariants = Parameters<typeof layoutRecipe>[0];
