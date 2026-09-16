import {
    palettes,
    CENTERS,
    WRAPPERS,
    CORNERS,
    FIELDS,
    FRAMES,
    SHADER_EDGES,
    SHADER_STRAPS,
    SHADER_GROUNDS,
    generateRecipe,
    pickColorMode,
    applyColorMode,
    pickGroutColor,
} from "@components/AzulejoTile/recipe";
import { mulberry32 } from "@lib/rand";

type Triplet = [number, number, number];

export interface AzulejoUniforms {
    uCenter: number;
    uWrapper: number;
    uCorners: number;
    uCenter2: number;
    uWrapper2: number;
    uCornersB: number;
    uEdges: number;
    uField: number;
    uStraps: number;
    uGround: number;
    uFrame: number;
    uV1: number;
    uV2: number;
    uImp: number;
    uIperf: [number, number];
    uBg: Triplet;
    uOl: Triplet;
    uC1: Triplet;
    uC2: Triplet;
    uC3: Triplet;
    uGrout: Triplet;
}

export function dealUniforms(seed: number): AzulejoUniforms {
    const rng = mulberry32(seed);
    rng();
    rng();
    const paletteIdx = Math.floor(rng() * palettes.length);
    const colorMode = pickColorMode(rng);
    const recipe = generateRecipe(rng);
    rng();
    const iperf: [number, number] = [rng() * 1000, rng() * 1000];
    const impJitter = 0.75 + rng() * 0.5;
    const groutCol = pickGroutColor(palettes[paletteIdx], rng);
    const potSwap = rng() < 0.05;

    const pal = palettes[paletteIdx];
    let eff = applyColorMode(pal, colorMode);
    if (recipe.mut && recipe.mut.paletteMix > 0.5) {
        const otherIdx =
            (paletteIdx + 1 + (seed % (palettes.length - 1))) % palettes.length;
        eff = {
            ...eff,
            c2: [...palettes[otherIdx].c1] as Triplet,
        };
    }
    if (potSwap) {
        eff = { ...eff, c1: eff.c3, c3: eff.c1 };
    }

    const idx = (list: readonly string[], v: string) => list.indexOf(v);
    return {
        uCenter: idx(CENTERS, recipe.center),
        uWrapper: idx(WRAPPERS, recipe.wrapper),
        uCorners: idx(CORNERS, recipe.corners),
        uCenter2: recipe.mut.center2 ? idx(CENTERS, recipe.mut.center2) : -1,
        uWrapper2: recipe.mut.wrapper2 ? idx(WRAPPERS, recipe.mut.wrapper2) : -1,
        uCornersB: recipe.mut.cornersB ? idx(CORNERS, recipe.mut.cornersB) : -1,
        uEdges: idx(SHADER_EDGES, recipe.edges),
        uField: idx(FIELDS, recipe.field),
        uStraps: idx(SHADER_STRAPS, recipe.straps),
        uGround: idx(SHADER_GROUNDS, recipe.ground),
        uFrame: idx(FRAMES, recipe.frame),
        uV1: recipe.v1,
        uV2: recipe.v2,
        uImp: Math.max(0, Math.min(1, 0.65 * impJitter)),
        uIperf: iperf,
        uBg: eff.bg,
        uOl: eff.ol,
        uC1: eff.c1,
        uC2: eff.c2,
        uC3: eff.c3,
        uGrout: groutCol,
    };
}
