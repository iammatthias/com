// The social loop: the home plate as a short clip that loops without a seam, for og:video.
// Drawn frame by frame by the card page (card/card.html, the plate's own shaders in WebGL2)
// with its clocks walked round a closed path (card.js `turning`), screenshotted at the card's
// 1200x630, and encoded with ffmpeg as one closed GOP. Generated once, by hand, and committed:
// the Worker serves the file for a year under its versioned path. A new look is a new -v path.
//
// The grain is the one thing H.264 can't afford. A fresh deal every frame costs 12 MB at crf 22,
// so the grain cycles through `deals` deals and the encoder keeps that many reference frames and
// no B-frames: a frame can copy its grain from the frame `deals` back. The spiral runs through
// every macroblock, though, so as long as the plate moves (`--pace`, 1 for its live pace) every
// block is re-coded every frame and the grain the P-frames carry drifts from the rendered grain
// (its energy falls a tenth over 8 s at crf 24) until the I-frame at the top of the loop restores
// it: the wrap step measures a fifth more than a typical step at crf 22 and 1.6 times one at
// crf 25, a grain refresh among 24 grain changes a second. Settling the clip through extra
// encode generations, a lower I-frame quality (ipratio) and a pre-settled first frame were all
// tried and none closed that gap, so the default holds the plate still (pace 0) and only the
// grain moves, as it does on the resting plate: every frame then copies its predecessor `deals`
// back exactly, the loop closes bit for bit, and the file is about a megabyte. The moving plate
// at pace 0.5 was 2.6 MB for 6 s at crf 25 with the seam above.
//
//   bun scripts/og-loop.ts [--seconds 6] [--fps 24] [--seed 0x5eed1234] [--crf 22]
//                          [--deals 8] [--pace 0] [--out assets/og-v1/loop.mp4] [--work <dir>]
//
// Needs ffmpeg and naga on PATH, and e2e's Playwright (cd e2e && bun install). The work dir
// (default: a temp dir) keeps the frames, a 3-loop preview (loop-x3.mp4) and a sheet of the six
// frames across the seam (seam.png). The seam is proved twice and printed: frame n against frame
// 0 as rendered (every clocked input is back where it started, so they match exactly), and the
// last decoded frame against the first, next to the steps between neighbouring frames, with the
// grain's energy at the start, middle and end of the decoded clip against the rendered frames.

import { chromium } from "../e2e/node_modules/playwright/index.mjs";
import { existsSync, mkdirSync, mkdtempSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const app = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WIDTH = 1200, HEIGHT = 630;

function flag(name: string, fallback: string): string {
    const i = process.argv.indexOf(`--${name}`);
    return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const seconds = Number(flag("seconds", "6"));
const fps = Number(flag("fps", "24"));
const seed = Number(flag("seed", "0x5eed1234")) >>> 0;
const crf = Number(flag("crf", "22"));
// grain deals in the cycle, and so reference frames: H.264 level 4.0 allows ten at this size
const deals = Number(flag("deals", "8"));
const pace = Number(flag("pace", "0"));
const out = resolve(app, flag("out", "assets/og-v1/loop.mp4"));
const work = resolve(flag("work", mkdtempSync(join(tmpdir(), "og-loop-"))));
const n = Math.round(seconds * fps);
if (n % deals !== 0) throw new Error(`${n} frames: the grain's ${deals} deals must cycle whole`);
const frames = join(work, "frames");
mkdirSync(frames, { recursive: true });
mkdirSync(dirname(out), { recursive: true });

function run(cmd: string[]): string {
    const p = Bun.spawnSync(cmd, { stderr: "pipe", stdout: "pipe" });
    if (p.exitCode !== 0) throw new Error(`${cmd[0]} failed:\n${p.stderr.toString()}`);
    return p.stdout.toString();
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
await page.goto(`http://127.0.0.1:${server.port}/card/card.html?kind=home&seed=${seed}`);
await page.waitForFunction(() => (window as unknown as { __cardReady?: boolean; __cardError?: string }).__cardReady || (window as unknown as { __cardError?: string }).__cardError, null, { timeout: 30000 });
const error = await page.evaluate(() => (window as unknown as { __cardError?: string }).__cardError);
if (error) throw new Error(`card: ${error}`);
const card = page.locator("#card");
const name = (k: number) => join(frames, `${String(k).padStart(4, "0")}.png`);
for (let k = 0; k <= n; k++) {
    await page.evaluate(
        ([k, n, seconds, deals, pace]) =>
            (window as unknown as { __cardLoop: (k: number, n: number, s: number, deals: number, pace: number) => Promise<void> }).__cardLoop(k, n, seconds, deals, pace),
        [k, n, seconds, deals, pace] as const,
    );
    await card.screenshot({ path: name(k), type: "png" });
    if (k % fps === 0) process.stdout.write(`\rframe ${k}/${n}`);
}
process.stdout.write(`\rframes 0..${n} in ${frames}\n`);
await browser.close();
server.stop(true);

// ---- the seam, measured: mean |a - b| over every channel, in 0..255 ----
async function* decoded(input: string[]): AsyncGenerator<Uint8Array> {
    const size = WIDTH * HEIGHT * 3;
    const proc = Bun.spawn(["ffmpeg", "-v", "error", ...input, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { stdout: "pipe", stderr: "inherit" });
    let frame = new Uint8Array(size), at = 0;
    for await (const chunk of proc.stdout) {
        let from = 0;
        while (from < chunk.length) {
            const take = Math.min(size - at, chunk.length - from);
            frame.set(chunk.subarray(from, from + take), at);
            at += take;
            from += take;
            if (at === size) {
                yield frame;
                frame = new Uint8Array(size);
                at = 0;
            }
        }
    }
    if ((await proc.exited) !== 0) throw new Error("ffmpeg failed to decode");
}
function meanAbs(a: Uint8Array, b: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
    return sum / a.length;
}
/** The steps between neighbouring frames, and the step from the last back to the first. */
async function seam(input: string[]): Promise<{ steps: number[]; wrap: number; count: number }> {
    const steps: number[] = [];
    let first: Uint8Array | null = null, prev: Uint8Array | null = null, count = 0;
    for await (const frame of decoded(input)) {
        if (!first) first = frame;
        if (prev) steps.push(meanAbs(prev, frame));
        prev = frame;
        count++;
    }
    if (!first || !prev) throw new Error("no frames decoded");
    return { steps, wrap: meanAbs(prev, first), count };
}
const quantiles = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b);
    return `min ${s[0].toFixed(3)}, median ${s[s.length >> 1].toFixed(3)}, max ${s[s.length - 1].toFixed(3)}`;
};

// as rendered: frames 0..n, so the last step is n-1 -> n (a typical step) and the wrap is n -> 0
const rendered = await seam(["-framerate", String(fps), "-i", join(frames, "%04d.png")]);
console.log(`rendered: frame ${n} vs frame 0 mean |diff| ${rendered.wrap.toFixed(6)} (${rendered.count} frames; steps ${quantiles(rendered.steps)})`);
if (rendered.wrap !== 0) throw new Error("the loop doesn't close: frame n differs from frame 0");

// ---- the clip: frames 0..n-1 as one closed GOP, a single keyframe at the top ----
run([
    "ffmpeg", "-y", "-v", "error", "-framerate", String(fps), "-i", join(frames, "%04d.png"), "-frames:v", String(n),
    "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
    "-c:v", "libx264", "-preset", "slow", "-crf", String(crf), "-profile:v", "high", "-level", "4.0",
    "-g", String(n), "-keyint_min", String(n), "-sc_threshold", "0", "-refs", String(deals), "-bf", "0",
    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
    "-movflags", "+faststart", "-an", out,
]);
const probe = JSON.parse(run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,nb_frames,duration,r_frame_rate,pix_fmt,codec_name", "-show_entries", "frame=key_frame", "-of", "json", out]));
const keyframes = (probe.frames as Array<{ key_frame: number }>).filter((f) => f.key_frame === 1).length;
const stream = probe.streams[0];
console.log(`${out}: ${(statSync(out).size / 1e6).toFixed(2)} MB, ${stream.codec_name} ${stream.pix_fmt} ${stream.width}x${stream.height}, ${stream.nb_frames} frames at ${stream.r_frame_rate}, ${Number(stream.duration).toFixed(3)} s, ${keyframes} keyframe(s)`);

// as encoded: the last decoded frame against the first, beside the steps between neighbours
const encoded = await seam(["-i", out]);
console.log(`encoded: last vs first mean |diff| ${encoded.wrap.toFixed(3)} (${encoded.count} frames; steps ${quantiles(encoded.steps)})`);

// the grain's energy (mean |laplacian| of the luma) along the clip: what the P-frames lose
function grainEnergy(input: string[]): number[] {
    const log = run(["ffmpeg", "-v", "error", ...input, "-vf", "format=gray,convolution=0m='0 -1 0 -1 4 -1 0 -1 0',signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-", "-f", "null", "-"]);
    return [...log.matchAll(/YAVG=([\d.]+)/g)].map((m) => Number(m[1]));
}
const at = (e: number[]) => `${e[0].toFixed(2)} / ${e[n >> 1].toFixed(2)} / ${e[n - 1].toFixed(2)}`;
console.log(`grain energy at frames 0 / ${n >> 1} / ${n - 1}: encoded ${at(grainEnergy(["-i", out]))}, rendered ${at(grainEnergy(["-framerate", String(fps), "-i", join(frames, "%04d.png"), "-frames:v", String(n)]))}`);

// ---- to look at: three loops end to end, and the six frames across the seam ----
run(["ffmpeg", "-y", "-v", "error", "-stream_loop", "2", "-i", out, "-c", "copy", join(work, "loop-x3.mp4")]);
run(["ffmpeg", "-y", "-v", "error", "-stream_loop", "1", "-i", out, "-vf", `select='between(n,${n - 3},${n + 2})',tile=3x2`, "-frames:v", "1", join(work, "seam.png")]);
console.log(`preview: ${join(work, "loop-x3.mp4")}\nseam sheet (last three frames, then the first three): ${join(work, "seam.png")}`);
