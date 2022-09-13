import { style } from '@vanilla-extract/css';
import { atoms } from '@/styles/atoms.css';

export const header = style([
  atoms({
    background: `black`,
    color: `white`,
    paddingX: {
      mobile: `16`,
      tablet: `32`,
    },
  }),
  {
    position: `relative`,
    width: `100%`,
    height: `100%`,
    display: `flex`,
    alignItems: `center`,
    justifyContent: `center`,
  },
]);

export const headerGrid = style({
  width: `100%`,
  display: `grid`,
  gridTemplateColumns: `1fr 1fr 1fr`,
});

export const headerStart = style({
  justifyContent: `flex-start`,
});

export const headerCenter = style({
  display: `flex`,
  justifyContent: `center`,
});

export const headerEnd = style({
  display: `flex`,
  justifyContent: `flex-end`,
});
