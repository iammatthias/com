import { style } from "@vanilla-extract/css";

export const header = style({
  display: "flex",
  borderBottom: "1px solid black",
  position: `sticky`,
  top: 0,
  alignSelf: `start`,
  margin: `0 32px`,
  background: `white`,
  boxShadow: `0 15px 15px -15px rgba(115,115,115,0.75)`,
});
