import { recipe } from '@vanilla-extract/recipes';

import { atoms } from '@/styles/sprinkles.css';

export const modalRecipe = recipe({
  variants: {
    modal: {
      wrapper: {
        display: `flex`,
        gap: `8px`,
      },
      image: {
        position: `relative`,
        width: `100%`,
        marginBottom: `8px`,
      },
      overlay: [
        atoms({
          background: `whiteFade`,
          position: `fixed`,
        }),
        {
          backdropFilter: `blur(50px) saturate(618%)`,
          inset: 0,
          zIndex: `100`,
        },
      ],
      contentWrapper: [
        atoms({
          position: `fixed`,
        }),
        {
          boxShadow: `hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px`,

          top: `50%`,
          left: `50%`,
          transform: `translate(-50%, -50%)`,
          width: `100%`,
          height: `100%`,
          zIndex: `101`,
          '&:focus': { outline: `none` },
        },
      ],
      content: {
        margin: `0 auto`,
        width: `auto`,
        maxWidth: `80%`,
        height: `100%`,
      },
      trigger: {
        padding: 0,
        margin: 0,
        border: 0,
        background: `transparent`,
        width: `100%`,
        '&:focus': { outline: `none` },
      },

      measure: {
        height: `100%`,
        width: `100%`,
        display: `flex`,
        flexDirection: `column`,
        alignItems: `center`,
        justifyContent: `center`,
      },
    },
  },
});

export type ModalVariants = Parameters<typeof modalRecipe>[0];
