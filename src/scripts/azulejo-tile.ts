
import { vertSrc, fragSrc } from "@components/AzulejoTile/shader";
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
    mulberry32,
    generateRecipe,
    pickColorMode,
    applyColorMode,
    pickGroutColor,
} from "@components/AzulejoTile/recipe";
import { hashSeed } from "@lib/format";

export interface AzulejoOptions {
    seed?: number;
    size?: number;
    wildness?: number;
    alt?: string;
    refireOnClick?: boolean;
}

const freshSeed = () => Date.now() + hashSeed(window.location.pathname);

const VERT_PRELUDE = "attribute vec3 position;\nattribute vec2 uv;\n";
const FRAG_PRELUDE =
    "#extension GL_OES_standard_derivatives : enable\n";

function compileShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string,
): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("[azulejo]", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

export function mountAzulejoTile(
    container: HTMLElement,
    opts: AzulejoOptions = {},
): ((seed?: number) => void) | null {
    const size = opts.size ?? 32;
    const wildness = opts.wildness ?? 1.0;
    const alt = opts.alt ?? "";

    const canvas = document.createElement("canvas");
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.setAttribute("role", "img");
    if (alt) canvas.setAttribute("aria-label", alt);
    else canvas.setAttribute("aria-hidden", "true");

    const attrs: WebGLContextAttributes = {
        antialias: true,
        alpha: true,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true,
    };
    const gl = canvas.getContext(
        "webgl",
        attrs,
    ) as WebGLRenderingContext | null;
    if (!gl) return null;
    gl.getExtension("OES_standard_derivatives");

    const vert = compileShader(gl, gl.VERTEX_SHADER, VERT_PRELUDE + vertSrc);
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_PRELUDE + fragSrc);
    if (!vert || !frag) return null;
    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("[azulejo]", gl.getProgramInfoLog(program));
        return null;
    }
    gl.useProgram(program);

    const attribute = (name: string, comps: number, data: number[]) => {
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(program, name);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, comps, gl.FLOAT, false, 0, 0);
    };
    attribute("position", 3, [-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]);
    attribute("uv", 2, [0, 0, 1, 0, 0, 1, 1, 1]);

    const u = (name: string) => gl.getUniformLocation(program, name);

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const px = Math.max(1, Math.round(size * ratio));
    canvas.width = px;
    canvas.height = px;
    gl.viewport(0, 0, px, px);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    gl.uniform2f(u("uRes"), px, px);

    const deal = (seed: number = freshSeed()) => {
        const rng = mulberry32(seed);
        rng(); rng();
        const paletteIdx = Math.floor(rng() * palettes.length);
        const colorMode = pickColorMode(rng);
        const recipe = generateRecipe(rng, wildness);
        rng();
        const iperf: [number, number] = [rng() * 1000, rng() * 1000];
        const impJitter = 0.75 + rng() * 0.5;
        const groutCol = pickGroutColor(palettes[paletteIdx], rng);
        const potSwap = rng() < 0.05;

        const pal = palettes[paletteIdx];
        let eff = applyColorMode(pal, colorMode);
        if (recipe.mut && recipe.mut.paletteMix > 0.5) {
            const otherIdx =
                (paletteIdx + 1 + (seed % (palettes.length - 1))) %
                palettes.length;
            eff = {
                ...eff,
                c2: [...palettes[otherIdx].c1] as [number, number, number],
            };
        }
        if (potSwap) {
            eff = { ...eff, c1: eff.c3, c3: eff.c1 };
        }

        const idx = (list: readonly string[], v: string) => list.indexOf(v);
        gl.uniform1f(u("uCenter"), idx(CENTERS, recipe.center));
        gl.uniform1f(u("uWrapper"), idx(WRAPPERS, recipe.wrapper));
        gl.uniform1f(u("uCorners"), idx(CORNERS, recipe.corners));
        gl.uniform1f(
            u("uCenter2"),
            recipe.mut.center2 ? idx(CENTERS, recipe.mut.center2) : -1,
        );
        gl.uniform1f(
            u("uWrapper2"),
            recipe.mut.wrapper2 ? idx(WRAPPERS, recipe.mut.wrapper2) : -1,
        );
        gl.uniform1f(
            u("uCornersB"),
            recipe.mut.cornersB ? idx(CORNERS, recipe.mut.cornersB) : -1,
        );
        gl.uniform1f(u("uEdges"), idx(SHADER_EDGES, recipe.edges));
        gl.uniform1f(u("uField"), idx(FIELDS, recipe.field));
        gl.uniform1f(u("uStraps"), idx(SHADER_STRAPS, recipe.straps));
        gl.uniform1f(u("uGround"), idx(SHADER_GROUNDS, recipe.ground));
        gl.uniform1f(u("uFrame"), idx(FRAMES, recipe.frame));
        gl.uniform1f(u("uV1"), recipe.v1);
        gl.uniform1f(u("uV2"), recipe.v2);
        gl.uniform1f(
            u("uImp"),
            Math.max(0, Math.min(1, 0.65 * impJitter)),
        );
        gl.uniform2f(u("uIperf"), iperf[0], iperf[1]);
        gl.uniform3f(u("uBg"), ...eff.bg);
        gl.uniform3f(u("uOl"), ...eff.ol);
        gl.uniform3f(u("uC1"), ...eff.c1);
        gl.uniform3f(u("uC2"), ...eff.c2);
        gl.uniform3f(u("uC3"), ...eff.c3);
        gl.uniform3f(u("uGrout"), ...groutCol);

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    deal(opts.seed);
    container.appendChild(canvas);

    if (opts.refireOnClick) {
        container.addEventListener("click", () => deal());
    }
    return deal;
}
