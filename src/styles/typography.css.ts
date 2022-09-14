interface Meta {
  fallback: string;
  file: string;
  format: string;
  name: string;
  wghtRange: string;
  wghts: {
    [key: string]: number;
  };
}

type FontFamilyId = 'RECURSIVE' | 'GTA' | 'GTA-MONO';

type Fonts = Record<FontFamilyId, Meta>;

const FONT_DIR = `/fonts`;

export const fonts: Fonts = {
  RECURSIVE: {
    fallback: `sans-serif`,
    file: `${FONT_DIR}/Recursive.ttf`,
    format: `truetype-variations`,
    name: `Recursive`,
    wghtRange: `100,900`,
    wghts: {
      '100': 100,
      '200': 200,
      '300': 300,
      '400': 400,
      '500': 500,
      '600': 600,
      '700': 700,
      '800': 800,
      '900': 900,
    },
  },
  GTA: {
    fallback: `sans-serif`,
    file: `${FONT_DIR}/gta/gta.woff2`,
    format: `woff2-variations`,
    name: `GT-A`,
    wghtRange: `200,700`,
    wghts: {
      '200': 200,
      '300': 300,
      '400': 400,
      '500': 500,
      '600': 600,
      '700': 700,
    },
  },
  'GTA-MONO': {
    fallback: `monospace`,
    file: `${FONT_DIR}/gta/gta-mono.woff2`,
    format: `woff2-variations`,
    name: `GT-A Mono`,
    wghtRange: `200,700`,
    wghts: {
      '200': 200,
      '300': 300,
      '400': 400,
      '500': 500,
      '600': 600,
      '700': 700,
    },
  },
};
