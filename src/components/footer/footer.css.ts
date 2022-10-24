import { style } from "@vanilla-extract/css";

export const footer = style({
  display: "flex",
  borderTop: "1px solid black",
  position: `sticky`,
  bottom: 0,
  alignSelf: `start`,
  margin: `0 32px`,
  background: `white`,
  boxShadow: `0 -15px 15px -15px rgba(115,115,115,0.75)`,
});
