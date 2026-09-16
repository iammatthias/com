
import { vertSrc, fragSrc } from "@components/AzulejoTile/shader";
import { dealUniforms } from "@components/AzulejoTile/deal";
import { createRasterCanvas, sizeToDpr } from "@lib/canvas";

interface AzulejoOptions {
    seed?: number;
    size?: number;
    alt?: string;
}

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
): ((seed: number) => void) | null {
    const size = opts.size ?? 32;
    const alt = opts.alt ?? "";

    const canvas = createRasterCanvas();
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

    const { width: px } = sizeToDpr(canvas, size, size);
    gl.viewport(0, 0, px, px);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    gl.uniform2f(u("uRes"), px, px);

    const loc = {
        uCenter: u("uCenter"),
        uWrapper: u("uWrapper"),
        uCorners: u("uCorners"),
        uCenter2: u("uCenter2"),
        uWrapper2: u("uWrapper2"),
        uCornersB: u("uCornersB"),
        uEdges: u("uEdges"),
        uField: u("uField"),
        uStraps: u("uStraps"),
        uGround: u("uGround"),
        uFrame: u("uFrame"),
        uV1: u("uV1"),
        uV2: u("uV2"),
        uImp: u("uImp"),
        uIperf: u("uIperf"),
        uBg: u("uBg"),
        uOl: u("uOl"),
        uC1: u("uC1"),
        uC2: u("uC2"),
        uC3: u("uC3"),
        uGrout: u("uGrout"),
    };

    const deal = (seed: number) => {
        const un = dealUniforms(seed);
        gl.uniform1f(loc.uCenter, un.uCenter);
        gl.uniform1f(loc.uWrapper, un.uWrapper);
        gl.uniform1f(loc.uCorners, un.uCorners);
        gl.uniform1f(loc.uCenter2, un.uCenter2);
        gl.uniform1f(loc.uWrapper2, un.uWrapper2);
        gl.uniform1f(loc.uCornersB, un.uCornersB);
        gl.uniform1f(loc.uEdges, un.uEdges);
        gl.uniform1f(loc.uField, un.uField);
        gl.uniform1f(loc.uStraps, un.uStraps);
        gl.uniform1f(loc.uGround, un.uGround);
        gl.uniform1f(loc.uFrame, un.uFrame);
        gl.uniform1f(loc.uV1, un.uV1);
        gl.uniform1f(loc.uV2, un.uV2);
        gl.uniform1f(loc.uImp, un.uImp);
        gl.uniform2f(loc.uIperf, un.uIperf[0], un.uIperf[1]);
        gl.uniform3f(loc.uBg, ...un.uBg);
        gl.uniform3f(loc.uOl, ...un.uOl);
        gl.uniform3f(loc.uC1, ...un.uC1);
        gl.uniform3f(loc.uC2, ...un.uC2);
        gl.uniform3f(loc.uC3, ...un.uC3);
        gl.uniform3f(loc.uGrout, ...un.uGrout);

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    if (opts.seed !== undefined) deal(opts.seed);
    container.appendChild(canvas);
    return deal;
}
