import { globalFontFace, globalStyle } from '@vanilla-extract/css';
import { fonts } from './typography.css';

// LOAD FONTS
//https://garden.bradwoods.io/notes/boilerplate-nextjs-typography

globalFontFace(`"${fonts.INTER.name}"`, {
  fontDisplay: `optional`,
  fontStyle: `normal`,
  fontWeight: fonts.INTER.weights.variable,
  src: `url("${fonts.INTER.files.variable}") format("${fonts.INTER.format}")`,
});

// CSS RESET
// https://garden.bradwoods.io/notes/css-reset

// Use a more intuitive box-sizing model.
globalStyle(`*, *::before, *::after`, {
  boxSizing: `border-box`,
});

// Remove all margins & padding.
globalStyle(`*`, {
  margin: 0,
  padding: 0,
});

// Prevent mobile browsers increasing font-size.
globalStyle(`html`, {
  textSizeAdjust: `none`,
});

// Allow percentage-based heights.
globalStyle(`html, body`, {
  height: `100%`,
});

globalStyle(`body`, {
  // Improve text rendering.
  fontSmooth: `antialiased`,
  // Prevent the rubber band scroll effect when the user hits the top or bottom of the document.
  overscrollBehavior: `none`,
  color: `black`,
});

// Remove unintuitive behaviour such as gaps around media elements.
globalStyle(`img, picture, video, canvas, svg, iframe`, {
  display: `block`,
});

// Avoid text overflow.
globalStyle(`h1, h2, h3, h4, h5, h6, p, strong`, {
  fontWeight: 400,
  overflowWrap: `break-word`,
});

globalStyle(`a`, {
  textDecoration: `none`,
});

globalStyle(`ul, ol`, {
  listStyle: `none`,
});

globalStyle(`input`, {
  border: `none`,
});

// Create a root stacking context (only when using JS frameworks like React).
globalStyle(`#__next`, {
  isolation: `isolate`,
});
