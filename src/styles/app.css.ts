import { globalFontFace } from '@vanilla-extract/css';
import { fonts } from './typography.css';

Object.values(fonts).forEach(({ name, wghtRange, file, format }) => {
  globalFontFace(`"${name}"`, {
    fontDisplay: `optional`,
    fontStyle: `normal`,
    fontWeight: wghtRange,
    src: `url("${file}") format("${format}")`,
  });
});
