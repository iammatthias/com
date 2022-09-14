import { style, globalStyle } from '@vanilla-extract/css';
import { atoms } from '@/styles/atoms.css';

export const layout = style({
  position: `relative`,
  display: `grid`,
  gridTemplateColumns: `1fr`,
  gridTemplateRows: `48px 1fr`,
});

export const layoutHeader = style({
  display: `flex`,
  alignItems: `center`,
  justifyContent: `center`,
  zIndex: `999`,
  position: `sticky`,
  top: 0,
});

export const layoutContent = style([
  atoms({
    margin: {
      mobile: `8`,
      tablet: `16`,
    },
    padding: {
      mobile: `8`,
      tablet: `16`,
    },
    columnGap: {
      mobile: `8`,
      tablet: `16`,
    },
    rowGap: {
      mobile: `64`,
      tablet: `128`,
    },
  }),
  {
    minHeight: `calc(100vh - 48px - 96px)`,
    border: `1px solid #000`,
    display: `grid`,
    gridAutoRows: `minmax(min-content, max-content)`,
    alignItems: `start`,
    position: `relative`,
    zIndex: `1`,
    gridTemplateColumns: `1fr 1fr 1fr 1fr 1fr`,
    '@media': {
      'screen and (min-width: 768px)': {
        gridTemplateColumns: `1fr 1fr 600px 1fr 1fr`,
      },
    },
    selectors: {
      '&:before': {
        content: ``,
        border: `1px solid #000`,
        position: `absolute`,
        top: -4,
        right: 0,
        bottom: -4,
        left: 0,
        zIndex: -1,
      },
      '&:after': {
        content: ``,
        border: `1px solid #000`,
        position: `absolute`,
        top: 0,
        right: -4,
        bottom: 0,
        left: -4,
        zIndex: -1,
      },
    },
  },
]);

globalStyle(`${layoutContent} > *`, {
  gridColumn: `1 / 6`,
  '@media': {
    'screen and (min-width: 768px)': {
      gridColumn: `3 / 4`,
    },
  },
});

export const layoutFooter = style({
  display: `flex`,
  alignItems: `center`,
  justifyContent: `center`,
});
