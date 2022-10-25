import { style } from "@vanilla-extract/css";

export const header = style({
  display: "flex",
  border: `1px solid white`,
  borderBottom: "1px solid black",
  position: `sticky`,
  top: 0,
  alignSelf: `start`,
  background: `white`,
  boxShadow: `0 15px 15px -15px rgb(0 0 0 / 30%)`,
  padding: `16px 0`,
});
