// The social loop: the home plate as an eight-second clip that loops without a seam, for
// og:video. Drawn frame by frame by the card page (card/card.html, the plate's own shaders in
// WebGL2) at the card's 1200x630, encoded through the x264 CLI as one closed GOP, and committed:
// Trunk copies assets/og-v1/ to /og-v1/ and the Worker keeps the file for a year. A new look is
// a new -v path. Generated once, by hand, with no flags for the committed clip:
//
//   bun scripts/og-loop.ts [--seconds 8] [--fps 24] [--seed 0x5eed1234] [--flow 2] [--grain 0]
//                          [--deals 4] [--pace 0] [--qp 27] [--out assets/og-v1/loop.mp4] [--work <dir>]
//                          [--card "kind=page&title=…"]   a page's card instead of the home plate
//
// The motion is the spiral flowing. card.js `turning` walks the line's phase (plate.wgsl mph.w)
// through `flow` whole turns over the loop, each turn carrying the line one spacing outward and
// so onto itself, while the drift, the warp and the lights hold still (pace 0). Every clocked
// input is back where it started at frame n, so frame n is frame 0 to the bit, which the script
// checks before it encodes.
//
// The encode is the seam's problem. H.264 can't afford the film grain over a moving plate (a
// fresh deal every frame was 12 MB at crf 22, and a grain cycled through `deals` reference
// frames drifts over the P-frames and pops at the keyframe), so the loop is drawn without it
// (--grain 0). With one I-frame at the top of the loop, the first frame is coded afresh at a
// quality the P-frames before it never reach, and the step across the seam stands above every
// other step: the loop pops once a lap. So every frame's quantiser is named in an x264 qpfile:
// the first frame an I at QP 4, a 12-frame ramp up to the base QP, the base held, a 24-frame
// ramp back down to QP 4, and the last frame coded intra at QP 4 like the first. Both ends of
// the loop are then the source within a quantiser step, and the seam is a step like any other.
//
// Needs ffmpeg, x264 (brew install x264) and naga (cargo install naga-cli) on PATH, and e2e's
// Playwright (cd e2e && bun install). The work dir (default: a temp dir) keeps the frames, the
// y4m, the qpfile, a 3-loop preview (loop-x3.mp4) and a sheet of the six frames across the seam
// (seam.png). The seam is proved twice and printed: frame n against frame 0 as rendered, exact,
// and the decoded clip's steps between neighbouring frames at 600 px gray, fine and in 8x8
// blocks, against its wrap (last to first) and the step into each keyframe. The last line says
// pass or FAIL: pass is a wrap and a keyframe step no more than 1.02x the largest inner step,
// fine and coarse, and a wrap under 1.25x the median step. The ramps' own steps are printed
// too: frames near QP 4 carry more detail per step, so they run a little above the held middle.

import { chromium } from "../e2e/node_modules/playwright/index.mjs";
import { existsSync, mkdirSync, mkdtempSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const app = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WIDTH = 1200, HEIGHT = 630;
// the quantiser plan: frames from the base QP down to the floor at each end of the loop
const RAMP = { start: 12, end: 24, floor: 4 };
// the pass line: how far above the clip's other steps the seam may stand
const BOUND = { overInnerMax: 1.02, wrapOverMedian: 1.25 };

for (const [tool, install] of [["ffmpeg", "brew install ffmpeg"], ["ffprobe", "brew install ffmpeg"], ["x264", "brew install x264"], ["naga", "cargo install naga-cli"]]) {
    if (!Bun.which(tool)) throw new Error(`${tool} is not on PATH (${install})`);
}

function flag(name: string, fallback: string): string {
    const i = process.argv.indexOf(`--${name}`);
    return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const seconds = Number(flag("seconds", "8"));
const fps = Number(flag("fps", "24"));
const seed = Number(flag("seed", "0x5eed1234")) >>> 0;
// whole turns of the spiral's phase over the loop, the line flowing outward one spacing per turn
// (negative: inward); 0 holds the line where the swings put it
const flow = Number(flag("flow", "2"));
// the film grain's amplitude, 1 as drawn
const grain = Number(flag("grain", "0"));
// the ab clock's deals in the cycle, and so reference frames: H.264 level 4.0 allows ten at this size
const deals = Number(flag("deals", "4"));
const pace = Number(flag("pace", "0"));
// the quantiser held through the middle of the loop
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

// ---- the card's shaders, as Trunk's pre-build hook makes them ----
const gen = join(app, "card/gen");
if (!existsSync(join(gen, "optics.frag")) || statSync(join(app, "src/plate.wgsl")).mtimeMs > statSync(join(gen, "optics.frag")).mtimeMs) {
    mkdirSync(gen, { recursive: true });
    const wgsl = join(app, "src/plate.wgsl");
    run(["naga", wgsl, join(gen, "vs.vert"), "--entry-point", "vs_main", "--profile", "es300", "--shader-stage", "vert"]);
    run(["naga", wgsl, join(gen, "plate.frag"), "--entry-point", "fs_plate", "--profile", "es300", "--shader-stage", "frag"]);
    run(["naga", wgsl, join(gen, "optics.frag"), "--entry-point", "fs_optics", "--profile", "es300", "--shader-stage", "frag"]);
}

// ---- the card page and the faces, served as the site serves them ----
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

// ---- the frames: 0..n, the last one the proof that the loop closes ----
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 })).newPage();
// a page's card instead of the home plate: its query as the og Worker sends it (cardQuery)
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

// ---- the steps between frames, as measured: mean |a - b| in 0..255 at 600 px gray, and in 8x8 blocks of that ----
const MW = 600, MH = 315, CW = MW / 8, CH = Math.floor(MH / 8);
function grayFrames(input: string[]): Uint8Array[] {
    const buf = runBytes(["ffmpeg", "-v", "error", ...input, "-vf", `scale=${MW}:${MH}:flags=area,format=gray`, "-f", "rawvideo", "-"]);
    const size = MW * MH;
    return Array.from({ length: Math.floor(buf.length / size) }, (_, i) => buf.subarray(i * size, (i + 1) * size));
}
// 8x8 box averages, where a pixel's noise averages out and the plate's structure remains
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
/** The steps between neighbouring frames (steps[i] is the step into frame i + 1), and the wrap from the last back to the first. */
type Steps = { steps: number[]; wrap: number };
const stepsOf = (frames: ArrayLike<number>[]): Steps => ({ steps: frames.slice(1).map((f, i) => meanAbs(frames[i], f)), wrap: meanAbs(frames[frames.length - 1], frames[0]) });
const max = (xs: number[]) => Math.max(...xs);
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[xs.length >> 1];

// as rendered: frame n against frame 0, every pixel
const rgb = (png: string) => runBytes(["ffmpeg", "-v", "error", "-i", png, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]);
const closes = Buffer.from(rgb(name(n))).equals(Buffer.from(rgb(name(0))));
const rendered = stepsOf(grayFrames(["-framerate", String(fps), "-i", join(frames, "%04d.png"), "-frames:v", String(n)]));
console.log(`rendered: frame ${n} ${closes ? "is" : "IS NOT"} frame 0 to the pixel; steps median ${median(rendered.steps).toFixed(3)}, wrap ${rendered.wrap.toFixed(3)}`);
if (!closes) throw new Error("the loop doesn't close: frame n differs from frame 0");

// ---- the quantiser plan: a line per frame, `frame type qp` ----
type FrameType = "I" | "P" | "i"; // an IDR, a predicted frame, an intra frame inside the GOP
function qpPlan(n: number, base: number): { frame: number; type: FrameType; qp: number }[] {
    const { start, end, floor } = RAMP;
    return Array.from({ length: n }, (_, k) => {
        const toward = k < start ? k / start : k >= n - end ? (n - 1 - k) / end : 1;
        return { frame: k, type: k === 0 ? "I" : k === n - 1 ? "i" : "P", qp: Math.round(floor + (base - floor) * toward) };
    });
}
const qpfile = join(work, "loop.qp");
writeFileSync(qpfile, qpPlan(n, qp).map((r) => `${r.frame} ${r.type} ${r.qp}`).join("\n") + "\n");

// ---- the clip: frames 0..n-1 as one closed GOP through x264, remuxed to MP4 by stream copy ----
// the frames as x264 reads them, in the encode's own bt709 tv-range yuv420p
const y4m = join(work, "loop.y4m");
run(["ffmpeg", "-y", "-v", "error", "-framerate", String(fps), "-i", join(frames, "%04d.png"), "-frames:v", String(n), "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p", "-f", "yuv4mpegpipe", y4m]);
// the qpfile names every frame's QP, which only takes effect under a crf mode (x264 ignores the
// file's QPs under --qp), so the crf value itself is moot; --no-mbtree keeps the lookahead from
// re-weighting macroblocks against the plan
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

// ---- the seam, as decoded: the wrap and the step into each keyframe against the other steps ----
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

// ---- to look at: three loops end to end, and the six frames across the seam ----
run(["ffmpeg", "-y", "-v", "error", "-stream_loop", "2", "-i", out, "-c", "copy", join(work, "loop-x3.mp4")]);
run(["ffmpeg", "-y", "-v", "error", "-stream_loop", "1", "-i", out, "-vf", `select='between(n,${n - 3},${n + 2})',tile=3x2`, "-frames:v", "1", join(work, "seam.png")]);
console.log(`preview: ${join(work, "loop-x3.mp4")}\nseam sheet (last three frames, then the first three): ${join(work, "seam.png")}`);
console.log(`seam: ${pass ? "pass" : "FAIL"} (the wrap and the step into a keyframe within ${BOUND.overInnerMax}x the largest inner step, fine and 8x8, and the wrap within ${BOUND.wrapOverMedian}x the median step)`);
process.exit(pass ? 0 : 1);
