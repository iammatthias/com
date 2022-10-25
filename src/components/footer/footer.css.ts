import { style } from "@vanilla-extract/css";

export const footer = style({
  display: "flex",
  justifyContent: `space-between`,
  border: `1px solid white`,
  borderTop: "1px solid black",
  position: `sticky`,
  bottom: 0,
  alignSelf: `start`,
  background: `white`,
  boxShadow: `0 -15px 15px -15px rgb(0 0 0 / 30%)`,
  padding: `16px 0`,
});

export const footerInner = style({});

export const rightAlignDesktop = style({
  textAlign: `right`,
  // "@media": {
  //   "screen and (max-width: 768px)": {
  //     textAlign: `left`,
  //   },
  // },
});
