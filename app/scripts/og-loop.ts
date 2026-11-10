import { chromium } from "../e2e/node_modules/playwright/index.mjs";
import { existsSync, mkdirSync, mkdtempSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const app = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WIDTH = 1200, HEIGHT = 630;
const RAMP = { start: 12, end: 24, floor: 4 };
const BOUND = { overInnerMax: 1.02, wrapOverMedian: 1.25 };

for (const [tool, install] of [["ffmpeg", "brew install ffmpeg"], ["ffprobe", "brew install ffmpeg"], ["x264", "brew install x264"]]) {
    if (!Bun.which(tool)) throw new Error(`${tool} is not on PATH (${install})`);
}

function flag(name: string, fallback: string): string {
    const i = process.argv.indexOf(`--${name}`);
    return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const seconds = Number(flag("seconds", "8"));
const fps = Number(flag("fps", "24"));
const seed = Number(flag("seed", "0x5eed1234")) >>> 0;
const flow = Number(flag("flow", "2"));
const grain = Number(flag("grain", "0"));
const deals = Number(flag("deals", "4"));
const pace = Number(flag("pace", "0"));
const qp = Number(flag("qp", "27"));
const out = resolve(app, flag("out", "assets/og-v1/loop.mp4"));
const work = resolve(flag("work", mkdtempSync(join(tmpdir(), "og-loop-"))));
const n = Math.round(seconds * fps);
if (!Number.isInteger(flow)) throw new Error(`flow ${flow}: only whole turns map the spiral onto itself`);
if (n % deals !== 0) throw new Error(`${n} frames: the ${deals} deals must cycle whole`);
const frames = join(work, "frames");
mkdirSync(frames, { recursive: true });
mkdirSync(dirname(out), { recursive: true });

function run(cmd: string[]): string {
    const p = Bun.spawnSync(cmd, { stderr: "pipe", stdout: "pipe" });
    if (p.exitCode !== 0) throw new Error(`${cmd[0]} failed:\n${p.stderr.toString()}`);
    return p.stdout.toString();
}
function runBytes(cmd: string[]): Uint8Array {
    const p = Bun.spawnSync(cmd, { stderr: "pipe", stdout: "pipe", maxBuffer: 1 << 30 });
    if (p.exitCode !== 0) throw new Error(`${cmd[0]} failed:\n${p.stderr.toString()}`);
    return new Uint8Array(p.stdout);
}

const gen = join(app, "card/gen");
if (!existsSync(join(gen, "optics.frag")) || statSync(join(app, "src/plate.wgsl")).mtimeMs > statSync(join(gen, "optics.frag")).mtimeMs) {
    if (!Bun.which("naga")) throw new Error("card/gen is older than src/plate.wgsl and naga is not on PATH (cargo install naga-cli)");
    mkdirSync(gen, { recursive: true });
    const wgsl = join(app, "src/plate.wgsl");
    run(["naga", wgsl, join(gen, "vs.vert"), "--entry-point", "vs_main", "--profile", "es300", "--shader-stage", "vert"]);
    run(["naga", wgsl, join(gen, "plate.frag"), "--entry-point", "fs_plate", "--profile", "es300", "--shader-stage", "frag"]);
    run(["naga", wgsl, join(gen, "optics.frag"), "--entry-point", "fs_optics", "--profile", "es300", "--shader-stage", "frag"]);
}

const server = Bun.serve({
    port: 0,
    hostname: "127.0.0.1",
    fetch(req) {
        const path = new URL(req.url).pathname;
        const file = path.startsWith("/card/") ? join(app, "card", path.slice(6)) : path.startsWith("/fonts-v1/") ? join(app, "assets/fonts", path.slice(10)) : null;
        if (!file || !existsSync(file) || statSync(file).isDirectory()) return new Response("not found", { status: 404 });
        return new Response(Bun.file(file));
    },
});

const browser = await chromium.launch({ args: (process.env.OG_CHROMIUM_ARGS ?? "").split(" ").filter(Boolean) });
const gpu = await browser.newPage();
const renderer = await gpu.evaluate(() => {
    const gl = document.createElement("canvas").getContext("webgl2");
    const info = gl?.getExtension("WEBGL_debug_renderer_info");
    return gl ? String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER)) : "no WebGL2";
});
await gpu.close();
console.log(`webgl: ${renderer}`);
const page = await (await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 })).newPage();
const query = flag("card", "kind=home");
await page.goto(`http://127.0.0.1:${server.port}/card/card.html?${query}&seed=${seed}&grain=${grain}`);
await page.waitForFunction(() => (window as unknown as { __cardReady?: boolean; __cardError?: string }).__cardReady || (window as unknown as { __cardError?: string }).__cardError, null, { timeout: 30000 });
const error = await page.evaluate(() => (window as unknown as { __cardError?: string }).__cardError);
if (error) throw new Error(`card: ${error}`);
const card = page.locator("#card");
const name = (k: number) => join(frames, `${String(k).padStart(4, "0")}.png`);
for (let k = 0; k <= n; k++) {
    await page.evaluate(
        ([k, n, seconds, deals, pace, flow]) =>
            (window as unknown as { __cardLoop: (k: number, n: number, s: number, deals: number, pace: number, flow: number) => Promise<void> }).__cardLoop(k, n, seconds, deals, pace, flow),
        [k, n, seconds, deals, pace, flow] as const,
    );
    await card.screenshot({ path: name(k), type: "png" });
    if (k % fps === 0) process.stdout.write(`\rframe ${k}/${n}`);
}
process.stdout.write(`\rframes 0..${n} in ${frames}\n`);
await browser.close();
server.stop(true);

const MW = 600, MH = 315, CW = MW / 8, CH = Math.floor(MH / 8);
function grayFrames(input: string[]): Uint8Array[] {
    const buf = runBytes(["ffmpeg", "-v", "error", ...input, "-vf", `scale=${MW}:${MH}:flags=area,format=gray`, "-f", "rawvideo", "-"]);
    const size = MW * MH;
    return Array.from({ length: Math.floor(buf.length / size) }, (_, i) => buf.subarray(i * size, (i + 1) * size));
}
function coarse(f: Uint8Array): Float32Array {
    const out = new Float32Array(CW * CH);
    for (let cy = 0; cy < CH; cy++) for (let cx = 0; cx < CW; cx++) {
        let s = 0;
        for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) s += f[(cy * 8 + y) * MW + cx * 8 + x];
        out[cy * CW + cx] = s / 64;
    }
    return out;
}
function meanAbs(a: ArrayLike<number>, b: ArrayLike<number>): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
    return sum / a.length;
}
type Steps = { steps: number[]; wrap: number };
const stepsOf = (frames: ArrayLike<number>[]): Steps => ({ steps: frames.slice(1).map((f, i) => meanAbs(frames[i], f)), wrap: meanAbs(frames[frames.length - 1], frames[0]) });
const max = (xs: number[]) => Math.max(...xs);
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[xs.length >> 1];

const rgb = (png: string) => runBytes(["ffmpeg", "-v", "error", "-i", png, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]);
const closes = Buffer.from(rgb(name(n))).equals(Buffer.from(rgb(name(0))));
const rendered = stepsOf(grayFrames(["-framerate", String(fps), "-i", join(frames, "%04d.png"), "-frames:v", String(n)]));
console.log(`rendered: frame ${n} ${closes ? "is" : "IS NOT"} frame 0 to the pixel; steps median ${median(rendered.steps).toFixed(3)}, wrap ${rendered.wrap.toFixed(3)}`);
if (!closes) throw new Error("the loop doesn't close: frame n differs from frame 0");

type FrameType = "I" | "P" | "i";
function qpPlan(n: number, base: number): { frame: number; type: FrameType; qp: number }[] {
    const { start, end, floor } = RAMP;
    return Array.from({ length: n }, (_, k) => {
        const toward = k < start ? k / start : k >= n - end ? (n - 1 - k) / end : 1;
        return { frame: k, type: k === 0 ? "I" : k === n - 1 ? "i" : "P", qp: Math.round(floor + (base - floor) * toward) };
    });
}
const qpfile = join(work, "loop.qp");
writeFileSync(qpfile, qpPlan(n, qp).map((r) => `${r.frame} ${r.type} ${r.qp}`).join("\n") + "\n");

const y4m = join(work, "loop.y4m");
run(["ffmpeg", "-y", "-v", "error", "-framerate", String(fps), "-i", join(frames, "%04d.png"), "-frames:v", String(n), "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p", "-f", "yuv4mpegpipe", y4m]);
const raw = join(work, "loop.264");
run([
    "x264", "--demuxer", "y4m", "--preset", "slow", "--crf", String(qp - 1), "--profile", "high", "--level", "4.0",
    "--keyint", String(n), "--min-keyint", String(n), "--no-scenecut", "--ref", String(deals), "--bframes", "0",
    "--colorprim", "bt709", "--transfer", "bt709", "--colormatrix", "bt709", "--range", "tv", "--no-mbtree",
    "--qpfile", qpfile, "-o", raw, y4m,
]);
run(["ffmpeg", "-y", "-v", "error", "-framerate", String(fps), "-i", raw, "-c", "copy", "-movflags", "+faststart", out]);
const probe = JSON.parse(run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,nb_frames,duration,r_frame_rate,pix_fmt,codec_name", "-show_entries", "frame=key_frame", "-of", "json", out]));
const keyIdx = (probe.frames as Array<{ key_frame: number }>).map((f, i) => (f.key_frame === 1 ? i : -1)).filter((i) => i >= 0);
const stream = probe.streams[0];
console.log(`${out}: ${(statSync(out).size / 1e6).toFixed(2)} MB, ${stream.codec_name} ${stream.pix_fmt} ${stream.width}x${stream.height}, ${stream.nb_frames} frames at ${stream.r_frame_rate}, ${Number(stream.duration).toFixed(3)} s, keyframes at ${keyIdx.join(", ")}`);

const gray = grayFrames(["-i", out]);
const keyed = new Set(keyIdx);
const inRamp = (k: number) => k < RAMP.start || k >= n - RAMP.end;
function judge(s: Steps, label: string, digits: number) {
    const into = (k: number) => (k === 0 ? s.wrap : s.steps[k - 1]);
    const inner = s.steps.filter((_, i) => !keyed.has(i + 1));
    const innerMax = max(inner), keyMax = max(keyIdx.map(into)), med = median(s.steps);
    const rampMax = max(s.steps.filter((_, i) => !keyed.has(i + 1) && inRamp(i + 1)));
    const f = (x: number) => x.toFixed(digits), r = (x: number) => (x / innerMax).toFixed(2);
    console.log(`${label}: steps median ${f(med)}, inner max ${f(innerMax)} (in the ramps ${f(rampMax)}); wrap ${f(s.wrap)} (${r(s.wrap)}x inner max, ${(s.wrap / med).toFixed(2)}x median), into a keyframe at most ${f(keyMax)} (${r(keyMax)}x)`);
    return { seam: Math.max(s.wrap, keyMax) / innerMax, wrapOverMedian: s.wrap / med };
}
const fine = judge(stepsOf(gray), "decoded, fine", 2);
const blocks = judge(stepsOf(gray.map(coarse)), "decoded, 8x8", 3);
const pass = fine.seam <= BOUND.overInnerMax && blocks.seam <= BOUND.overInnerMax && fine.wrapOverMedian <= BOUND.wrapOverMedian;

run(["ffmpeg", "-y", "-v", "error", "-stream_loop", "2", "-i", out, "-c", "copy", join(work, "loop-x3.mp4")]);
run(["ffmpeg", "-y", "-v", "error", "-stream_loop", "1", "-i", out, "-vf", `select='between(n,${n - 3},${n + 2})',tile=3x2`, "-frames:v", "1", join(work, "seam.png")]);
console.log(`preview: ${join(work, "loop-x3.mp4")}\nseam sheet (last three frames, then the first three): ${join(work, "seam.png")}`);
console.log(`seam: ${pass ? "pass" : "FAIL"} (the wrap and the step into a keyframe within ${BOUND.overInnerMax}x the largest inner step, fine and 8x8, and the wrap within ${BOUND.wrapOverMedian}x the median step)`);
process.exit(pass ? 0 : 1);
