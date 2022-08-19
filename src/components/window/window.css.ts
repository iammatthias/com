import { style, globalStyle } from '@vanilla-extract/css';

export const windowWrapper = style({
  position: `relative`,
  zIndex: `10`,
  height: `calc(100vh - 288px)`,
  width: `calc(100vw - 192px)`,
  display: `flex`,
  flexDirection: `column`,
  justifyContent: `center`,
  alignItems: `center`,
  overflow: `hidden`,
  borderRadius: `8px`,
  border: `2px solid #1a1a1a`,
  boxShadow: `0px 0px 11.6px -10px rgba(0, 0, 0, 0.109),
  0px 0px 23.4px -10px rgba(0, 0, 0, 0.156),
  0px 0px 38.4px -10px rgba(0, 0, 0, 0.176),
  0px 0px 57.2px -10px rgba(0, 0, 0, 0.183),
  0px 0px 80.7px -10px rgba(0, 0, 0, 0.186),
  0px 0px 110.2px -10px rgba(0, 0, 0, 0.191),
  0px 0px 148.3px -10px rgba(0, 0, 0, 0.205),
  0px 0px 199.3px -10px rgba(0, 0, 0, 0.233),
  0px 0px 275.1px -10px rgba(0, 0, 0, 0.287),
  0px 0px 500px -10px rgba(0, 0, 0, 0.38)`,
  '@media': {
    'screen and (max-width: 768px)': {
      width: `calc(100vw - 96px)`,
      height: `calc(100vh - 278px)`,
    },
  },
});

export const window = style({
  position: `relative`,
  height: `100%`,
  width: `100%`,
  display: `flex`,
  flexDirection: `column`,
  justifyContent: `center`,
  overflow: `hidden`,
  background: `#fdfcfc`,
  margin: `0 32px`,
});

export const windowOverlay = style({
  position: `absolute`,
  bottom: `50%`,
  left: `50%`,
  transform: `translate(-50%, 50%)`,
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
  fontSize: `4vw`,
  float: `left`,
  marginRight: `8px`,
  fontFamily: `'Losta Bonita', serif`,
});

export const windowOverlaySpanLarge = style({
  position: `relative`,
  fontSize: `12vw`,
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
  top: `3vw`,
});

export const windowImage = style({
  position: `absolute`,
  top: `0`,
  left: `0`,
  right: `0`,
  bottom: `0`,
});
