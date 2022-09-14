// reset.css.ts
// Globals + CSS Reset.

import { globalStyle } from '@vanilla-extract/css';

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
  fontSize: `24px`,
});

globalStyle(`body`, {
  // Improve text rendering.
  fontSmooth: `antialiased`,
  // Prevent the rubber band scroll effect when the user hits the top or bottom of the document.
  overscrollBehavior: `none`,
  color: `black`,
});

// Remove unintuitive behavior such as gaps around media elements.
globalStyle(`img, picture, video, canvas, svg, iframe`, {
  display: `block`,
});

// Avoid text overflow.
globalStyle(
  `h1, h2, h3, h4, h5, h6, p, strong, em, pre, code, blockquote, ul, ol, li`,
  {
    fontWeight: 400,
    overflowWrap: `break-word`,
  },
);

globalStyle(`a`, {
  textDecoration: `none`,
  color: `inherit`,
});

globalStyle(`ul, ol`, {
  listStyle: `none`,
});

globalStyle(`input`, {
  border: `none`,
});

// Avoid text overflow.
globalStyle(`pre`, {
  whiteSpace: `pre-wrap`,
});

// Create a root stacking context (only when using JS frameworks like React).
globalStyle(`#__next`, {
  isolation: `isolate`,
});
