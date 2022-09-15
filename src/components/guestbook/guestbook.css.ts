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
        flexDirection: `column`,
        gap: 16,
      },
      guestlistItem: {
        width: `100%`,
        display: `flex`,
        flexDirection: `column`,
        gap: 16,
      },
      guestlistMeta: {
        display: `flex`,
        flexDirection: `column`,
        alignContent: `center`,
        gap: `16px`,
        '@media': {
          'screen and (min-width: 768px)': {
            flexDirection: `row`,
            justifyContent: `space-between`,
          },
        },
      },
      input: {
        padding: `16px`,
        border: `solid 2px`,
        borderColor: `black`,
        color: `black`,
        background: `transparent`,
        display: `block`,
        maxWidth: `618px`,
        width: `calc(100% - 16px)`,
        fontSize: `24px`,
        fontFamily: `GT-A Mono`,
      },
    },
  },
});

export type GuestbookVariants = Parameters<typeof guestbookRecipe>[0];
