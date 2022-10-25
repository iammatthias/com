import { globalStyle, globalFontFace } from "@vanilla-extract/css";
import { fonts } from "./typography.css";

Object.values(fonts).forEach(({ name, wghtRange, file, format }) => {
  globalFontFace(`"${name}"`, {
    fontDisplay: `optional`,
    fontStyle: `normal`,
    fontWeight: wghtRange,
    src: `url("${file}") format("${format}")`,
  });
});

globalStyle(`html`, {
  fontSize: `16px`,
});

globalStyle(`body`, {
  fontFamily: `"GT-A Mono", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`,
  fontSize: `1rem`,
});

globalStyle(`body *`, {
  fontFamily: `"GT-A Mono", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`,
});

globalStyle(`p`, {
  fontSize: `1rem`,
});

globalStyle(`h1`, {
  fontSize: `3.052rem`,
});

globalStyle(`h2`, {
  fontSize: `2.441rem`,
});

globalStyle(`h3`, {
  fontSize: `1.953rem`,
});

globalStyle(`h4`, {
  fontSize: `1.563rem`,
});

globalStyle(`h5`, {
  fontSize: `1.25rem`,
});

globalStyle(`h6`, {
  fontSize: `1rem`,
});

globalStyle(`small`, {
  fontSize: `0.8rem`,
});

globalStyle(`a`, {
  color: `inherit`,
  textDecoration: `underline`,
  fontSize: `inherit`,
});

globalStyle(`ul`, {
  listStyle: `inside`,
  listStyleType: `disc`,
  padding: 0,
  margin: `0 0 0 1.5rem`,
  display: `flex`,
  flexDirection: `column`,
  gap: `8px`,
});

globalStyle(`pre, code`, {
  fontFamily: `Space Mono, monospace`,
});
