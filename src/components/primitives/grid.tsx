import { styled } from '@/styles/stitches.config';

const Grid = styled(`article`, {
  position: `relative`,
  margin: `0 auto`,
  padding: `2rem 1rem`,
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
  variants: {
    hero: {
      '@bp2': {
        '> *': {
          gridColumn: `1 / 8`,
        },
      },
      '@bp3': {
        '> *': {
          gridColumn: `2 / 7`,
        },
      },
      '@bp4': {
        '> *': {
          gridColumn: `3 / 6`,
        },
      },
    },
  },
});

export default Grid;
