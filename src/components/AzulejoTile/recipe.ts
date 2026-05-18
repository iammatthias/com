// Recipe / palette / RNG logic extracted from the standalone azulejo prototype.
// Pure TypeScript — no Three.js dependency at this layer, so the recipe shape
// can be generated and inspected without touching WebGL.

export interface Palette {
  name: string;
  bg: [number, number, number];
  ol: [number, number, number];
  c1: [number, number, number];
  c2: [number, number, number];
  c3: [number, number, number];
}

export interface Recipe {
  center: string;
  wrapper: string;
  corners: string;
  edges: string;
  field: string;
  straps: string;
  ground: string;
  frame: string;
  v1: number;
  v2: number;
  mut: {
    center2: string | null;
    wrapper2: string | null;
    cornersB: string | null;
    paletteMix: number;
  };
}

export const palettes: Palette[] = [
  { name:'LISBON COBALT',  bg:[0.962,0.940,0.860], ol:[0.060,0.130,0.380], c1:[0.180,0.350,0.690], c2:[0.620,0.760,0.890], c3:[0.820,0.620,0.220] },
  { name:'DELFT INDIGO',   bg:[0.972,0.965,0.925], ol:[0.045,0.078,0.220], c1:[0.110,0.200,0.500], c2:[0.520,0.660,0.860], c3:[0.180,0.300,0.580] },
  { name:'POLYCHROME',     bg:[0.960,0.930,0.840], ol:[0.130,0.090,0.180], c1:[0.860,0.620,0.160], c2:[0.190,0.420,0.700], c3:[0.300,0.560,0.330] },
  { name:'MANGANESE',      bg:[0.952,0.920,0.840], ol:[0.190,0.080,0.190], c1:[0.520,0.190,0.420], c2:[0.800,0.620,0.720], c3:[0.300,0.110,0.260] },
  { name:'VERDE AZULEJO',  bg:[0.950,0.930,0.840], ol:[0.080,0.180,0.110], c1:[0.220,0.490,0.300], c2:[0.860,0.730,0.300], c3:[0.480,0.290,0.110] },
  { name:'SEVILLA EARTH',  bg:[0.940,0.880,0.745], ol:[0.190,0.090,0.060], c1:[0.720,0.300,0.180], c2:[0.220,0.310,0.560], c3:[0.500,0.390,0.150] },
  { name:'IZNIK',          bg:[0.972,0.948,0.880], ol:[0.060,0.190,0.380], c1:[0.770,0.200,0.190], c2:[0.090,0.450,0.560], c3:[0.300,0.560,0.400] },
  { name:'NIGHT GLAZE',    bg:[0.110,0.150,0.230], ol:[0.890,0.870,0.770], c1:[0.200,0.450,0.700], c2:[0.700,0.620,0.380], c3:[0.880,0.780,0.480] },
  { name:'COIMBRA YELLOW', bg:[0.978,0.948,0.840], ol:[0.080,0.060,0.150], c1:[0.940,0.760,0.220], c2:[0.140,0.260,0.520], c3:[0.560,0.220,0.180] },
  { name:'ESTREMOZ',       bg:[0.965,0.952,0.910], ol:[0.060,0.090,0.180], c1:[0.290,0.440,0.640], c2:[0.870,0.820,0.700], c3:[0.700,0.420,0.260] },
  { name:'AÇORES MOSS',    bg:[0.945,0.935,0.870], ol:[0.060,0.140,0.090], c1:[0.310,0.500,0.260], c2:[0.730,0.770,0.420], c3:[0.560,0.330,0.180] },
  { name:'PORTO ROUGE',    bg:[0.960,0.928,0.840], ol:[0.190,0.060,0.060], c1:[0.690,0.180,0.180], c2:[0.280,0.300,0.520], c3:[0.860,0.700,0.300] },
  /* New palettes — broader regional / stylistic range */
  { name:'PERSIAN BLUE',   bg:[0.985,0.978,0.950], ol:[0.030,0.060,0.180], c1:[0.090,0.250,0.580], c2:[0.180,0.580,0.700], c3:[0.940,0.860,0.500] },
  { name:'ROSA LISBOA',    bg:[0.970,0.940,0.890], ol:[0.330,0.130,0.180], c1:[0.870,0.520,0.520], c2:[0.620,0.380,0.290], c3:[0.490,0.580,0.430] },
  { name:'GRANADA',        bg:[0.962,0.918,0.820], ol:[0.140,0.040,0.040], c1:[0.760,0.180,0.150], c2:[0.180,0.490,0.310], c3:[0.880,0.700,0.220] },
  { name:'MADEIRA SEA',    bg:[0.880,0.940,0.945], ol:[0.040,0.150,0.220], c1:[0.090,0.350,0.520], c2:[0.940,0.500,0.420], c3:[0.870,0.820,0.640] },
  { name:'HISPANO LUSTRE', bg:[0.945,0.910,0.800], ol:[0.180,0.090,0.030], c1:[0.700,0.470,0.140], c2:[0.420,0.260,0.140], c3:[0.860,0.760,0.460] },
  { name:'TALAVERA',       bg:[0.970,0.940,0.835], ol:[0.110,0.080,0.150], c1:[0.940,0.730,0.180], c2:[0.180,0.380,0.660], c3:[0.310,0.540,0.290] },

  /* Iberian / Mediterranean */
  { name:'AMALFI',         bg:[0.978,0.962,0.910], ol:[0.080,0.150,0.260], c1:[0.230,0.560,0.760], c2:[0.940,0.760,0.260], c3:[0.700,0.290,0.220] },
  { name:'CATALONIA',      bg:[0.965,0.918,0.820], ol:[0.180,0.070,0.060], c1:[0.760,0.180,0.150], c2:[0.940,0.760,0.220], c3:[0.140,0.290,0.150] },
  { name:'MAJORCA',        bg:[0.952,0.940,0.890], ol:[0.060,0.140,0.230], c1:[0.250,0.500,0.690], c2:[0.860,0.620,0.180], c3:[0.580,0.300,0.340] },
  { name:'PUEBLA SKY',     bg:[0.978,0.962,0.920], ol:[0.045,0.090,0.220], c1:[0.180,0.380,0.700], c2:[0.760,0.700,0.300], c3:[0.860,0.500,0.200] },

  /* North African / Moroccan zellige */
  { name:'FEZ MEDINA',     bg:[0.965,0.935,0.840], ol:[0.110,0.060,0.060], c1:[0.680,0.190,0.160], c2:[0.180,0.400,0.310], c3:[0.860,0.700,0.220] },
  { name:'MARRAKESH',      bg:[0.940,0.880,0.730], ol:[0.230,0.110,0.070], c1:[0.860,0.340,0.130], c2:[0.220,0.420,0.480], c3:[0.580,0.380,0.150] },
  { name:'CHEFCHAOUEN',    bg:[0.935,0.955,0.965], ol:[0.080,0.180,0.300], c1:[0.300,0.560,0.760], c2:[0.500,0.720,0.860], c3:[0.890,0.860,0.700] },
  { name:'SAHARA DUSK',    bg:[0.940,0.870,0.700], ol:[0.230,0.140,0.080], c1:[0.760,0.420,0.160], c2:[0.480,0.200,0.150], c3:[0.880,0.700,0.380] },
  { name:'ATLAS GREEN',    bg:[0.960,0.940,0.860], ol:[0.080,0.140,0.060], c1:[0.260,0.500,0.220], c2:[0.580,0.380,0.180], c3:[0.880,0.760,0.380] },

  /* Middle Eastern / Persian / Turkish */
  { name:'ISFAHAN',        bg:[0.972,0.952,0.880], ol:[0.060,0.180,0.380], c1:[0.140,0.280,0.620], c2:[0.230,0.580,0.660], c3:[0.860,0.620,0.220] },
  { name:'KASHAN',         bg:[0.955,0.918,0.820], ol:[0.110,0.060,0.180], c1:[0.180,0.300,0.620], c2:[0.700,0.400,0.180], c3:[0.580,0.560,0.220] },
  { name:'BOSPHORUS',      bg:[0.972,0.948,0.860], ol:[0.060,0.180,0.300], c1:[0.220,0.450,0.620], c2:[0.700,0.180,0.200], c3:[0.180,0.420,0.300] },
  { name:'DAMASCUS',       bg:[0.940,0.918,0.840], ol:[0.180,0.110,0.060], c1:[0.560,0.180,0.150], c2:[0.180,0.380,0.500], c3:[0.860,0.700,0.200] },

  /* Asian inspired */
  { name:'CELADON',        bg:[0.940,0.948,0.910], ol:[0.080,0.140,0.110], c1:[0.560,0.700,0.580], c2:[0.760,0.700,0.480], c3:[0.480,0.260,0.180] },
  { name:'KYOTO INDIGO',   bg:[0.972,0.962,0.940], ol:[0.040,0.080,0.180], c1:[0.110,0.250,0.480], c2:[0.620,0.260,0.230], c3:[0.760,0.700,0.480] },
  { name:'IMARI',          bg:[0.985,0.972,0.940], ol:[0.060,0.110,0.230], c1:[0.180,0.350,0.620], c2:[0.760,0.200,0.180], c3:[0.880,0.760,0.220] },

  /* Modern / contemporary palettes */
  { name:'CORAL REEF',     bg:[0.985,0.955,0.910], ol:[0.180,0.060,0.110], c1:[0.940,0.420,0.380], c2:[0.220,0.580,0.620], c3:[0.860,0.760,0.380] },
  { name:'DESERT BLOOM',   bg:[0.985,0.955,0.880], ol:[0.180,0.080,0.110], c1:[0.860,0.380,0.420], c2:[0.700,0.580,0.220], c3:[0.220,0.480,0.560] },
  { name:'CHARCOAL & ROSE',bg:[0.220,0.200,0.220], ol:[0.880,0.860,0.800], c1:[0.880,0.480,0.520], c2:[0.620,0.560,0.620], c3:[0.880,0.760,0.420] },
  { name:'BOTANIC',        bg:[0.962,0.945,0.880], ol:[0.080,0.150,0.080], c1:[0.260,0.480,0.220], c2:[0.580,0.420,0.180], c3:[0.860,0.760,0.380] },
  { name:'MIDNIGHT GARDEN',bg:[0.140,0.180,0.220], ol:[0.860,0.800,0.620], c1:[0.260,0.560,0.420], c2:[0.880,0.620,0.300], c3:[0.700,0.500,0.620] },
  { name:'CARNIVAL',       bg:[0.978,0.948,0.860], ol:[0.110,0.060,0.110], c1:[0.940,0.300,0.260], c2:[0.180,0.480,0.860], c3:[0.940,0.860,0.180] }
];

export const CENTERS  = ['empty','dot','circle','star','rosette','flower','petal4','interlace',
                  'cross','quatre','lozenge','pinwheel','sun','tulip',
                  'octagram','hexagram','carnation','sunburst','knot'] as const;
export const WRAPPERS = ['none','ring','petalRing','sqFrame','octagon','beadRing','scallop',
                  'hexagon','sawtooth','twistRope'] as const;
export const CORNERS  = ['none','qRose','qStar','qMedal','leaf','acanthus','cluster','floral',
                  'fan','tendril','tassel','scroll'] as const;
export const EDGES    = ['none','none','none','eDot','eDots3','eDiamond','eHalfRose','eAcorn',
                  'eStar','eChev','eCrown'] as const;
export const FIELDS   = ['none','dots4','dots4d','crosses','beads','dots8','fStars'] as const;
export const STRAPS   = ['none','none','none','none','diagArm','diagPair','cardArm','rays8',
                  'curvArm','knotArm'] as const;
export const GROUNDS  = ['none','none','gDots','gFlecks','gFlorets','gWhisks','gQuincunx','gStars'] as const;
export const FRAMES   = ['none','thin','double','thick','beaded','cornerSq','chevron','rope',
                  'pearls','dentils','triple','chain','diamonds'] as const;

/* visual weight for balance budget */
const W: Record<string, Record<string, number>> = {
  centers: { empty:0, dot:1, circle:2, star:3, rosette:3, flower:3, petal4:3, interlace:3,
             cross:3, quatre:3, lozenge:2, pinwheel:3, sun:2, tulip:3,
             octagram:3, hexagram:3, carnation:3, sunburst:3, knot:3 },
  wrappers:{ none:0, ring:1, petalRing:2, sqFrame:2, octagon:2, beadRing:1, scallop:2,
             hexagon:2, sawtooth:2, twistRope:2 },
  corners: { none:0, qRose:2, qStar:3, qMedal:2, leaf:2, acanthus:2, cluster:1, floral:2,
             fan:2, tendril:2, tassel:2, scroll:2 },
  edges:   { none:0, eDot:1, eDots3:1, eDiamond:2, eHalfRose:3, eAcorn:2,
             eStar:2, eChev:1, eCrown:2 },
  fields:  { none:0, dots4:1, dots4d:1, crosses:1, beads:1, dots8:2, fStars:2 },
  straps:  { none:0, diagArm:2, diagPair:2, cardArm:2, rays8:3, curvArm:2, knotArm:3 },
  grounds: { none:0, gDots:1, gFlecks:1, gFlorets:1, gWhisks:1, gQuincunx:1, gStars:1 },
  frames:  { none:0, thin:1, double:2, thick:2, beaded:1, cornerSq:2, chevron:3, rope:3,
             pearls:3, dentils:3, triple:2, chain:2, diamonds:2 },
};

/** mulberry32 — small fast 32-bit seeded PRNG */
export function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isCompatible(r: Recipe): boolean {
  if (r.center === "empty" && r.wrapper === "none" && r.corners === "none" &&
      r.edges === "none" && r.field === "none" && r.straps === "none" &&
      r.ground === "none" && r.frame === "none") return false;
  if (r.center === "empty" && r.wrapper === "none" && r.corners === "none" &&
      r.edges === "none" && r.field === "none" && r.straps === "none" &&
      r.ground === "none") return false;
  if (r.frame === "cornerSq" && r.corners !== "none") return false;
  const total =
    W.centers[r.center] + W.wrappers[r.wrapper] + W.corners[r.corners] +
    W.edges[r.edges]    + W.fields[r.field]     + W.straps[r.straps] +
    W.grounds[r.ground] + W.frames[r.frame];
  return total >= 3 && total <= 17;
}

function pickFromList<T>(list: readonly T[], rng: () => number): T {
  return list[Math.floor(rng() * list.length)];
}

function pickMutations(rng: () => number, r: Recipe, wildness: number): Recipe["mut"] {
  const w = wildness == null ? 1.0 : wildness;
  const mut: Recipe["mut"] = { center2: null, wrapper2: null, cornersB: null, paletteMix: 0 };
  if (w <= 0.001) return mut;
  if (r.center !== "empty" && rng() < 0.22 * w) {
    const candidates = CENTERS.filter((c) => c !== "empty" && c !== r.center);
    mut.center2 = candidates[Math.floor(rng() * candidates.length)];
  }
  if (r.wrapper !== "none" && rng() < 0.18 * w) {
    const candidates = WRAPPERS.filter((x) => x !== "none" && x !== r.wrapper);
    mut.wrapper2 = candidates[Math.floor(rng() * candidates.length)];
  }
  if (r.corners !== "none" && rng() < 0.25 * w) {
    const candidates = CORNERS.filter((c) => c !== "none" && c !== r.corners);
    mut.cornersB = candidates[Math.floor(rng() * candidates.length)];
  }
  if (rng() < 0.20 * w) mut.paletteMix = 1.0;
  return mut;
}

export function generateRecipe(rng: () => number, wildness = 1.0): Recipe {
  for (let i = 0; i < 200; i++) {
    const candidate: Recipe = {
      center:  pickFromList(CENTERS, rng),
      wrapper: pickFromList(WRAPPERS, rng),
      corners: pickFromList(CORNERS, rng),
      edges:   pickFromList(EDGES, rng),
      field:   pickFromList(FIELDS, rng),
      straps:  pickFromList(STRAPS, rng),
      ground:  pickFromList(GROUNDS, rng),
      frame:   pickFromList(FRAMES, rng),
      v1: rng(),
      v2: rng(),
      mut: { center2: null, wrapper2: null, cornersB: null, paletteMix: 0 },
    };
    if (isCompatible(candidate)) {
      candidate.mut = pickMutations(rng, candidate, wildness);
      return candidate;
    }
  }
  // Fallback if 200 attempts find nothing valid — extremely unlikely.
  return {
    center: "star", wrapper: "none", corners: "qMedal",
    edges: "none", field: "none", straps: "none", ground: "gDots",
    frame: "double", v1: rng(), v2: rng(),
    mut: { center2: null, wrapper2: null, cornersB: null, paletteMix: 0 },
  };
}

export function pickColorMode(r: () => number): 0 | 1 | 2 | 3 {
  const v = r();
  if (v < 0.22) return 0;
  if (v < 0.50) return 1;
  if (v < 0.75) return 2;
  return 3;
}

type Triplet = [number, number, number];

export function applyColorMode(
  pal: Palette,
  mode: 0 | 1 | 2 | 3,
): { bg: Triplet; ol: Triplet; c1: Triplet; c2: Triplet; c3: Triplet } {
  const out = {
    bg: [...pal.bg] as Triplet,
    ol: [...pal.ol] as Triplet,
    c1: [...pal.c1] as Triplet,
    c2: [...pal.c2] as Triplet,
    c3: [...pal.c3] as Triplet,
  };
  if (mode === 0) {
    out.c1 = [...pal.bg] as Triplet;
    out.c2 = [...pal.bg] as Triplet;
    out.c3 = [...pal.bg] as Triplet;
  } else if (mode === 1) {
    out.c2 = [...pal.bg] as Triplet;
    out.c3 = [...pal.bg] as Triplet;
  } else if (mode === 2) {
    out.c3 = [...pal.c1] as Triplet;
  }
  return out;
}

export function pickGroutColor(pal: Palette, rng: () => number): Triplet {
  const bg = pal.bg;
  const bgLum = 0.30 * bg[0] + 0.59 * bg[1] + 0.11 * bg[2];
  const mix3 = (a: Triplet, b: Triplet, t: number): Triplet => [
    a[0] * (1 - t) + b[0] * t,
    a[1] * (1 - t) + b[1] * t,
    a[2] * (1 - t) + b[2] * t,
  ];
  const scl = (a: Triplet, k: number): Triplet => [a[0] * k, a[1] * k, a[2] * k];
  const clamp = (a: Triplet): Triplet =>
    a.map((v) => Math.max(0, Math.min(1, v))) as Triplet;

  if (bgLum < 0.40) {
    const candidates: Triplet[] = [
      clamp([0.86, 0.78, 0.62]),
      clamp([0.74, 0.72, 0.66]),
      clamp([0.78, 0.74, 0.64]),
      clamp(mix3([0.85, 0.82, 0.74], pal.ol, 0.20)),
    ];
    return candidates[Math.floor(rng() * candidates.length)];
  }
  const candidates: Triplet[] = [
    clamp(mix3(scl(pal.ol, 0.55), [0.18, 0.16, 0.14], 0.45)),
    clamp([0.46, 0.34, 0.18]),
    clamp([0.42, 0.22, 0.16]),
    clamp([0.34, 0.36, 0.24]),
    clamp([0.26, 0.30, 0.34]),
    clamp(scl(pal.c3, 0.50)),
    clamp(scl(pal.c1, 0.45)),
  ];
  return candidates[Math.floor(rng() * candidates.length)];
}

/** Canonical index lists matching the shader's dispatch tables. */
export const SHADER_EDGES = ["none","eDot","eDots3","eDiamond","eHalfRose","eAcorn",
                             "eStar","eChev","eCrown"] as const;
export const SHADER_STRAPS = ["none","diagArm","diagPair","cardArm","rays8",
                              "curvArm","knotArm"] as const;
export const SHADER_GROUNDS = ["none","gDots","gFlecks","gFlorets","gWhisks",
                               "gQuincunx","gStars"] as const;
