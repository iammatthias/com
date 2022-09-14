import { style, globalStyle } from '@vanilla-extract/css';

export const windowWrapper = style({
  gridColumn: `1 / 6`,
  margin: `0 0 32px`,
  position: `relative`,
  zIndex: 2,
  height: `calc(100vh - 48px - 64px)`,
  width: `100%`,
  display: `flex`,
  flexDirection: `column`,
  justifyContent: `center`,
  alignItems: `center`,
  overflow: `hidden`,

  boxShadow: `0px 0px 23.3px rgba(0, 0, 0, 0.064),
  0px 0px 42.6px rgba(0, 0, 0, 0.068),
  0px 0px 58.9px rgba(0, 0, 0, 0.069),
  0px 0px 74.7px rgba(0, 0, 0, 0.07),
  0px 0px 95.9px rgba(0, 0, 0, 0.07),
  0px 0px 137px rgba(0, 0, 0, 0.07)`,
});

export const window = style({
  position: `relative`,
  height: `100%`,
  width: `100%`,
  display: `flex`,
  flexDirection: `column`,
  justifyContent: `center`,
  background: `#fdfcfc`,
});

export const windowOverlay = style({
  position: `absolute`,
  bottom: `50%`,
  left: `50%`,
  transform: `translate(-50%, 50%)`,
  zIndex: `2`,
  mixBlendMode: `difference`,
  fontWeight: `bold`,
  color: `#fdfcfc`,
});

export const windowOverlaySpanWrapper = style({
  display: `block`,
});

export const windowOverlaySpanSmall = style({
  position: `relative`,
  fontSize: `4vw`,
  float: `left`,
  marginLeft: `32px`,
  marginRight: `32px`,
  fontFamily: `GT-A, serif`,
  fontVariationSettings: `"wght" 700, "wdth" 1000, "DISP" 1000`,
});

export const windowOverlaySpanLarge = style({
  position: `relative`,
  fontSize: `24vw`,
  float: `left`,
  lineHeight: `1`,
  fontFamily: `GT-A, serif`,
  fontVariationSettings: `"wght" 700, "wdth" 1000, "DISP" 1000`,
});

globalStyle(`${windowOverlaySpanSmall} > span`, {
  fontFamily: `inherit`,
});

globalStyle(`${windowOverlaySpanLarge} > span`, {
  fontFamily: `inherit`,
});

export const windowOverlayHR = style({
  position: `relative`,
  top: `2.5vw`,
  marginRight: `36px`,
});

export const windowImage = style({
  position: `absolute`,
  top: `0`,
  left: `0`,
  right: `0`,
  bottom: `0`,
});
