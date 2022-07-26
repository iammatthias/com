// Thought.css
// Language: typescript

// Scoped styles for `Thoughts`.

import { recipe } from '@vanilla-extract/recipes';

export const thoughtRecipe = recipe({
  variants: {
    thought: {
      wrapper: { border: `1px solid`, borderColor: `$text`, padding: `16px` },
      content: {
        margin: `0 0 16px`,
        padding: `0 0 16px`,
        display: `flex`,
        gap: `16px`,
        alignItems: `flex-end`,
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
        gap: `16px`,
      },
    },
  },
});

export type ThoughtVariants = Parameters<typeof thoughtRecipe>[0];
