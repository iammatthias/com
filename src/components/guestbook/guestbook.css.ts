// Guestbook.css
// Language: typescript

// Scoped styles for `Guestbook`.

import { recipe } from '@vanilla-extract/recipes';

export const guestbookRecipe = recipe({
  variants: {
    guestbook: {
      guestbookWrapper: {
        width: `calc(100% - 16px)`,
      },
      collapsibleNotesWrapper: {
        width: `calc(100% - 16px)`,
      },
      collapsibleNotesSubWrapper: {
        display: `flex`,
        gap: 8,
      },
      guestlistItem: {
        width: `100%`,
        display: `flex`,
        flexDirection: `column`,
        gap: 8,
      },
      guestlistMeta: {
        display: `flex`,
        alignContent: `center`,
        justifyContent: `space-between`,
      },
      input: {
        padding: `8px`,
        border: `solid 1px`,
        borderColor: `text`,
        color: `text`,
        background: `transparent`,
        display: `block`,
        maxWidth: `618px`,
        width: `calc(100% - 16px)`,
      },
    },
  },
});

export type GuestbookVariants = Parameters<typeof guestbookRecipe>[0];
