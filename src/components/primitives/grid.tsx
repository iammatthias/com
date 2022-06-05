import { styled } from '@/styles/stitches.config';

import { useAutoAnimate } from '@formkit/auto-animate/react';

export default function Grid({ props, children }: any) {
  const [parent] = useAutoAnimate({ duration: 1000, easing: `ease-in-out` });

  const Grid = styled(`article`, {
    position: `relative`,
    margin: `0 auto`,
    padding: `0`,
    display: `grid`,
    gridTemplateColumns: `1fr 1fr 1fr 6fr 1fr 1fr 1fr`,
    gridTemplateRows: `auto`,
    gridGap: `1rem`,
    '> *': {
      gridColumn: `1 / 8`,
    },

    '@bp1': {
      '> *': {
        gridColumn: `1 / 8`,
      },
    },
    '@bp2': {
      '> *': {
        gridColumn: `2 / 7`,
      },
    },
    '@bp3': {
      '> *': {
        gridColumn: `3 / 6`,
      },
    },
    '@bp4': {
      '> *': {
        gridColumn: `4 / 5`,
      },
    },
  });

  return (
    <Grid ref={parent as any} {...props}>
      {children}
    </Grid>
  );
}
