import { style, globalStyle } from '@vanilla-extract/css';

export const windowWrapper = style({
  height: `100%`,
  maxHeight: `538px`,
  width: `100%`,
  maxWidth: `384px`,
  display: `flex`,
  flexDirection: `column`,
  justifyContent: `center`,
  alignItems: `center`,
  padding: `0 16px`,
});

export const window = style({
  position: `relative`,
  height: `384px`,
  width: `100%`,
  maxWidth: `384px`,
  border: `2px solid #1a1a1a`,
  borderRadius: `50% 50% 4px 4px`,
  display: `flex`,
  flexDirection: `column`,
  justifyContent: `center`,
  alignItems: `center`,
  overflow: `hidden`,
  background: `#fdfcfc`,
  margin: `0 32px`,
});

export const windowOverlay = style({
  position: `absolute`,
  bottom: `16px`,
  left: `24px`,
  zIndex: `1`,
  mixBlendMode: `difference`,
  fontWeight: `bold`,
  color: `#fdfcfc`,
});

export const windowOverlaySpanWrapper = style({
  display: `block`,
});

export const windowOverlaySpanSmall = style({
  position: `relative`,
  fontSize: `25px`,
  float: `left`,
  marginRight: `16px`,
  fontFamily: `'Losta Bonita', serif`,
});

export const windowOverlaySpanLarge = style({
  position: `relative`,
  fontSize: `40px`,
  float: `left`,
  fontFamily: `'Losta Bonita', serif`,
  lineHeight: `1`,
});

globalStyle(`${windowOverlaySpanSmall} > span`, {
  fontFamily: `inherit`,
});

globalStyle(`${windowOverlaySpanLarge} > span`, {
  fontFamily: `inherit`,
});

export const windowOverlayHR = style({
  border: `1px solid`,
  borderColor: `inherit`,
  position: `relative`,
  top: `28px`,
});

export const windowImage = style({
  position: `absolute`,
  top: `0`,
  left: `0`,
  right: `0`,
  bottom: `0`,
});
