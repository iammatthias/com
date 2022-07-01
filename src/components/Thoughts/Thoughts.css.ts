import { recipe } from '@vanilla-extract/recipes';

import { atoms } from '@/styles/sprinkles.css';

export const thoughtRecipe = recipe({
  variants: {
    thought: {
      wrapper: { border: `1px solid`, borderColor: `$text`, padding: `16px` },
      content: {
        margin: `0 0 16px`,
        padding: `0 0 16px`,
        display: `flex`,
        gap: `16px`,
        alignItems: `end`,
        justifyContent: `space-between`,
        borderBottom: `1px solid`,
        ':last-child': {
          position: `relative`,
          margin: `0`,
          padding: `0`,
          border: `none`,
        },
      },
      contentGrid: {
        display: `flex`,
        flexDirection: `column`,
        gap: `8px`,
      },
    },
  },
});

export type ThoughtVariants = Parameters<typeof thoughtRecipe>[0];
