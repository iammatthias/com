import { recipe } from '@vanilla-extract/recipes';

export const galleryRecipe = recipe({
  variants: {
    gallery: {
      wrapper: {
        display: `flex`,
        gap: `8px`,
      },
      image: {
        position: `relative`,
        width: `100%`,
        marginBottom: `8px`,
      },
    },
  },
});

export type GalleryVariants = Parameters<typeof galleryRecipe>[0];
