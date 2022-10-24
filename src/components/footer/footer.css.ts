import { style } from "@vanilla-extract/css";

export const footer = style({
  display: "flex",
  justifyContent: `space-between`,
  borderTop: "1px solid black",
  position: `sticky`,
  bottom: 0,
  alignSelf: `start`,
  margin: `0 32px`,
  background: `white`,
  boxShadow: `0 -15px 15px -15px rgba(115,115,115,0.75)`,
});

export const rightAlignDesktop = style({
  textAlign: `right`,
  // "@media": {
  //   "screen and (max-width: 768px)": {
  //     textAlign: `left`,
  //   },
  // },
});
