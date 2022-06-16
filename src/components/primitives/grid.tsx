import { styled } from '@/styles/stitches.config';

export default function Grid({ children, ...props }: any) {
  const Grid = styled(`article`, {
    position: `relative`,
    margin: `0 auto`,
    padding: `0`,
    display: `grid`,
    gridTemplateColumns: `1fr 1fr 1fr 6fr 1fr 1fr 1fr`,
    gridTemplateRows: `fit-content(100%)`,
    gridGap: `1rem`,
    alignContent: `start`,
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
    ...props.css,
  });

  return <Grid {...props}>{children}</Grid>;
}
