// The social card: plate.wgsl's two passes (the engraving, then its optics), compiled to GLSL by
// naga at build time (card/gen/), drawn once in WebGL2 with the plate's seeded variance and its
// clocks pinned, so the same inputs give the same picture (or, for the social loop, drawn frame
// by frame with the clocks walked round a circle: `turning`). No lettering on the line: the home
// card is the spiral and the portrait; a page card is the line framing a paper box, its title
// set in the box as type; the app icon is the bare spiral, square and coarse enough to read small.
//
// Mirrors src/plate/ (the Deal, the uniforms, the line geometry the flares ride); keep in step.

const q = new URLSearchParams(location.search);
const kind = ["page", "icon"].includes(q.get("kind")) ? q.get("kind") : "home";
const seed = (Number(q.get("seed")) >>> 0) || 0x5eed1234;

const TAU = Math.PI * 2;
// drawn at twice the card's 1200x630, shown at size; an icon at eight times 192 square: few
// turns, and a line that stays bold once shrunk to a home screen
const DPR = kind === "icon" ? 8 : 2, W = kind === "icon" ? 1536 : 2400, H = kind === "icon" ? 1536 : 1260;
const SPACING = 15; // css px between turns
const LIFT = 0.06, SUBJECT = 0.264, CONTROL_RADIUS = 20;
const FONT = 40, PEN_RAW = (2.52 * FONT) / 52, HAIR = (5 * FONT) / 52, PAD = 10;
const CONTROLS = { warp: 2.15, disp: 0.45, ab: 0.35, flare: 0.4, haze: 0.3 };
// light paper, always: a card doesn't follow anyone's colour scheme
const hex = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255, 1];
const PAPER = hex(0xf4efe4), INK = hex(0x1b1814), ACCENT = hex(0x1f55c2);
const STOPS = [0x3c60bc, 0x1F7549, 0x88600c, 0xAD4826, 0x8a4ba8].map(hex);

// ---- the plate's random draws (src/seed.rs Rng, src/plate/ Deal) ----
function rng(s) {
    s >>>= 0;
    return {
        next() {
            s = (s + 0x6d2b79f5) >>> 0;
            let t = s;
            t = Math.imul(t ^ (t >>> 15), 1 | t) >>> 0;
            t = ((t + Math.imul(t ^ (t >>> 7), 61 | t)) >>> 0) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        },
        pick(items) {
            return items[Math.min(Math.floor(this.next() * items.length), items.length - 1)];
        },
    };
}
function deal(s) {
    const r = rng(s);
    const wph = [r.next() * TAU, r.next() * TAU, r.next() * TAU, r.next() * TAU];
    const wfq = [0.78 + r.next() * 0.5, 0.78 + r.next() * 0.5, r.pick([2, 3, 4]), r.pick([4, 5, 6, 7])];
    const mph = [r.next() * TAU, r.next() * TAU, 0.75 + r.next() * 0.55];
    const t_off = r.next();
    const osc = [r.next(), r.next(), r.next()];
    const fl = [];
    for (let i = 0; i < 3; i++) {
        const radius = 0.18 + r.next() * 0.42;
        const dir = r.next() < 0.5 ? -1 : 1;
        fl.push([radius, dir * (0.04 + r.next() * 0.1), r.next() * TAU, r.next()]);
    }
    const ab_ph = [r.next() * TAU, r.next() * TAU, r.next() * TAU, r.next() * TAU];
    r.next(); // the artifact draws a direction it then overwrites
    const ab_freq = 2 + Math.floor(r.next() * 4);
    const ab_dir = [r.next() * 2 - 1, 0];
    return { wph, wfq, mph, t_off, osc, fl, ab_ph, ab_freq, ab_dir };
}
const z = deal(seed);
const warpAt = (qx, qy, qr, a, t) =>
    Math.sin(qx * 5.1 * z.wfq[0] + t * 0.4 + z.wph[0]) * Math.sin(qy * 4.3 * z.wfq[1] - t * 0.33 + z.wph[1]) +
    0.6 * Math.sin(a * z.wfq[2] + qr * 9 - t * 0.27 + z.wph[2]) +
    0.35 * Math.sin(a * z.wfq[3] - qr * 14 + t * 0.21 + z.wph[3]);
const smooth = (a, b, x) => {
    const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
    return t * t * (3 - 2 * t);
};
function penFactor(w) {
    if (w < 270) return 0.6 + ((w - 100) / 170) * 0.4;
    if (w < 500) return 1 + ((w - 270) / 230) * 0.55;
    return 1.55 + ((w - 500) / 400) * 0.95;
}
const penWeight = () => {
    const h = Math.imul(seed, 0x9e3779b1) >>> 0;
    return 270 + (((h >>> 13) | (h << 19)) >>> 0) % 6 * 16;
};

// ---- the moment the card shows: the clocks pinned by the seed ----
const C0 = 10 + z.osc[0] * 50; // the controls' clock (C)
const T0 = 4 + z.t_off * 40; // the drift (T)
// an icon's few turns tangle at the card's warp and fringe: it takes a calmer share of both
const CALM = kind === "icon" ? Number(q.get("calm") || 0.35) : 1;
const framing = kind === "page" ? 1 : 0;
const mn = Math.min(W, H);
const lift = kind === "icon" ? 0 : LIFT * mn * (1 - framing); // the head sits high; an icon has none
const d = SPACING * DPR;
// how fast each of warp_f's four terms turns with the drift (plate.wgsl warp_f)
const WARP_RATES = [0.4, -0.33, -0.27, 0.21];

// Everything on the plate that moves, at one instant. T is the drift the line's warp follows
// (here and in the shader) and c the controls' clock the warp and disp breathe on. The shader
// reads its own two clocks, ut (the drift) and ab (the ab clock): its optics run on ut/2 + ab
// and its grain on floor(ab * 60), so a frame can hand it any pair with the right sum, and the
// warp's phases carry the difference so the line stays where T puts it. turns: where each light
// is along the line.
function moment({ T, c, ut, ab, turns }) {
    const ease = (period, phase) => 0.5 - 0.5 * Math.cos((c / period + phase) * TAU);
    return {
        T, ut, ab, turns,
        eWarp: CALM * CONTROLS.warp * (0.35 + 0.65 * ease(29, z.osc[1])),
        eDisp: CONTROLS.disp * (0.35 + 0.65 * ease(53, z.osc[2])),
        wph: z.wph.map((p, i) => p + WARP_RATES[i] * (T - ut)),
    };
}
const still = () => moment({ T: T0, c: C0, ut: T0, ab: C0 * 0.4, turns: restingTurns() });

// The plate round a closed path: frame k of n over `seconds`. Each clock swings about its
// pinned value on one sine, at `pace` times its live pace at the fastest (the drift at speed
// 0.9·0.2·0.675, the controls at 1/s, so the optics at 0.46/s; a light at 8 css px/s), every
// swing back where it started at frame n. The grain can't swing (its frame index would stall
// and retrace at the turns), so it deals afresh each frame through a cycle of `deals` (n a
// multiple of it), the shader's two clocks sharing the optics' time between them. The swings
// start out of step, so no two rest together.
function turning(k, n, seconds, deals, pace) {
    const phi = (k / n) * TAU;
    const swing = (rate, phase) => ((pace * rate * seconds) / TAU) * Math.sin(phi + phase);
    const optics = T0 / 2 + C0 * 0.4 + swing(0.46, 0);
    const ab = (Math.floor(C0 * 0.4 * 60) + (k % deals) + 0.5) / 60;
    return moment({
        T: T0 + swing(0.12, 0.5 * Math.PI),
        c: C0 + swing(1, Math.PI),
        ut: 2 * (optics - ab),
        ab,
        turns: restingTurns().map((p, i) => p + Math.sign(z.fl[i][1]) * swing((8 * DPR) / (TAU * d * (p + 0.5)), ((i + 1) * TAU) / 4)),
    });
}

// ---- the portrait, for the home card (and for where the line lies under it) ----
let portrait = null;
async function loadPortrait() {
    if (kind !== "home") return;
    portrait = new Uint8Array(await (await fetch("portrait.r8")).arrayBuffer());
}
function tone(qx, qy) {
    if (!portrait || Math.abs(qx) > SUBJECT || Math.abs(qy) > SUBJECT) return 0.06;
    const n = 256;
    const x = Math.min(Math.max((0.5 + qx / (2 * SUBJECT)) * n - 0.5, 0), n - 1);
    const y = Math.min(Math.max((0.5 - qy / (2 * SUBJECT)) * n - 0.5, 0), n - 1);
    const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(x0 + 1, n - 1), y1 = Math.min(y0 + 1, n - 1);
    const fx = x - x0, fy = y - y0, at = (xx, yy) => portrait[yy * n + xx] / 255;
    const top = at(x0, y0) + (at(x1, y0) - at(x0, y0)) * fx;
    const bottom = at(x0, y1) + (at(x1, y1) - at(x0, y1)) * fx;
    return Math.min(Math.max(top + (bottom - top) * fy, 0.04), 0.95);
}

// ---- the core the line winds around (none for home, the text's box for a page) ----
let core = [0, 0, 0, 0];
function coreDist(x, y, bx, by) {
    const dx = Math.abs(x) - bx, dy = Math.abs(y) - by;
    return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0);
}
function coreTurn(x, y, bx, by, dd) {
    const total = 4 * (bx + by) + TAU * dd;
    const PI = Math.PI;
    let l;
    if (x < -bx && Math.abs(y) <= by) l = y <= 0 ? -y : total - y;
    else if (x < -bx && y < -by) l = by + dd * (Math.atan2(y + by, x + bx) + PI);
    else if (Math.abs(x) <= bx && y < 0) l = by + dd * PI * 0.5 + (x + bx);
    else if (x > bx && y < -by) l = by + dd * PI * 0.5 + 2 * bx + dd * (Math.atan2(y + by, x - bx) + PI * 0.5);
    else if (x > bx && Math.abs(y) <= by) l = by + dd * PI + 2 * bx + (y + by);
    else if (x > bx && y > by) l = 3 * by + dd * PI + 2 * bx + dd * Math.atan2(y - by, x - bx);
    else if (Math.abs(x) <= bx && y > 0) l = 3 * by + dd * PI * 1.5 + 2 * bx + (bx - x);
    else l = 3 * by + dd * PI * 1.5 + 4 * bx + dd * (Math.atan2(y - by, x + bx) - PI * 0.5);
    return Math.min(Math.max(l / Math.max(total, 1e-3), 0), 1);
}
// the line's own coordinates at a plate point, as plate/ line_at
function lineAt(px, py, m) {
    const qx = px / mn, qy = py / mn, qr = Math.hypot(qx, qy), ang = Math.atan2(py, px);
    const pcx = px - core[0], pcy = py - core[1];
    const dist = coreDist(pcx, pcy, core[2], core[3]);
    const tn0 = tone(qx, qy + lift / mn);
    const dark = 0.06 + (tn0 + (0.1 - tn0) * framing - 0.06);
    const calm = smooth(0, 0.12, qr) + (smooth(0, 6 * d, dist) - smooth(0, 0.12, qr)) * framing;
    const rr = dist + d * (m.eWarp * warpAt(qx, qy, qr, ang, m.T) * calm + m.eDisp * (dark - 0.5));
    const an = coreTurn(pcx, pcy, core[2], core[3], Math.max(rr, 0));
    return [rr / d - an, an];
}
// where a light sits: on the centre of the line, p turns out (as plate/ point_on_line)
function pointOnLine(p, m) {
    const theta = ((((p % 1) + 1) % 1) - 0.5) * TAU, cx = Math.cos(theta), cy = Math.sin(theta);
    const edge = Math.abs(cx) * core[3] > Math.abs(cy) * core[2] ? core[2] / Math.max(Math.abs(cx), 1e-4) : core[3] / Math.max(Math.abs(cy), 1e-4);
    let r = edge + d * (p + 0.5);
    for (let i = 0; i < 24; i++) {
        const [tt, an] = lineAt(core[0] + cx * r, core[1] + cy * r, m);
        const step = (p + 0.5 - (tt + an)) * d;
        r = Math.max(r + Math.min(Math.max(step, -0.5 * d), 0.5 * d), 0);
        if (Math.abs(step) < 0.05) break;
    }
    return [core[0] + cx * r, core[1] + cy * r];
}
// the turn each light starts on (plate/ move_flares): clear of the face, at its seeded radius
function restingTurns() {
    const first = Math.max((SUBJECT * 1.25 * mn + lift) / d, 4) * (1 - framing) + 4 * framing;
    return z.fl.map(([radius, , phase]) => Math.max(Math.floor((radius * mn) / d), Math.ceil(first)) + phase / TAU);
}
function flares(m) {
    return z.fl.map(([, , phase, hue], i) => {
        const [x, y] = pointOnLine(m.turns[i], m);
        return [x, y, phase, hue];
    });
}

// ---- the text (page cards): set in the box the line frames ----
function setText() {
    if (kind !== "page") return;
    document.body.classList.add("page");
    const put = (id, v) => {
        const el = document.getElementById(id);
        el.textContent = v || "";
        el.style.display = v ? "" : "none";
    };
    put("eyebrow", q.get("eyebrow"));
    put("title", q.get("title") || "iammatthias");
    put("description", q.get("description"));
    // a long title steps down until it sits in three lines
    const title = document.getElementById("title");
    for (let size = 64; size > 40; size -= 4) {
        title.style.fontSize = `${size}px`;
        const lines = Math.round(title.getBoundingClientRect().height / (size * 1.04));
        if (lines <= 3) break;
    }
    // the core: the text's box and a margin of paper round it, in plate device px (y up)
    const r = document.getElementById("text").getBoundingClientRect();
    const padX = 56, padY = 44;
    const cxCss = r.left + r.width / 2, cyCss = r.top + r.height / 2;
    core = [cxCss * DPR - W / 2, H / 2 - cyCss * DPR - lift, (r.width / 2 + padX) * DPR, (r.height / 2 + padY) * DPR];
}

// ---- WebGL2: the two passes ----
const canvas = document.getElementById("plate");
if (kind === "icon") {
    canvas.width = W;
    canvas.height = H;
    document.body.classList.add("icon");
}
const gl = canvas.getContext("webgl2", { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true });

function program(vs, fs) {
    const make = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, make(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, make(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
}
function texture(w, h, format, internal, data, filter = gl.LINEAR) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
}
function bindSampler(p, name, unit, tex) {
    const loc = gl.getUniformLocation(p, name);
    if (loc === null) return;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(loc, unit);
}

// where each field of plate.wgsl's `struct U` starts, in vec4 slots (src/plate/contract.rs checks it)
const SLOT = {
    rtd: 0, line: 1, script: 2, sheet: 3, rows: 4, view: 5, wph: 6, wfq: 7, mph: 8, optics: 9, clocks: 10,
    ab_ph: 11, pen: 12, frame: 13, fl0: 14, fl1: 15, fl2: 16, ink: 17, paper: 18, accent: 19, panes: 20,
    glass: 24, stops: 25,
};

function uniforms(m) {
    const u = new Float32Array(30 * 4);
    const set = (i, v) => u.set(v, i * 4);
    set(SLOT.rtd, [W, H, m.ut, d]);
    set(SLOT.line, [-3, m.eWarp, m.eDisp, 1]); // a lettering bias low enough that nothing is written
    set(SLOT.script, [1, 0, HAIR, 2]);
    set(SLOT.sheet, [1, 1, 1, 1]); // the (empty) atlas
    set(SLOT.rows, [PAD, 1, 1, 0]); // zoom 1
    set(SLOT.view, [0, 0, -9, -9]); // no pan, nothing hovered
    set(SLOT.wph, m.wph);
    set(SLOT.wfq, z.wfq);
    set(SLOT.mph, [z.mph[0], z.mph[1], z.mph[2], 0]);
    set(SLOT.optics, [1, CONTROLS.flare, CONTROLS.haze, CONTROLS.ab * CALM]);
    set(SLOT.clocks, [DPR, z.ab_freq, m.ab, 1]); // fully revealed
    set(SLOT.ab_ph, z.ab_ph);
    set(SLOT.pen, [z.ab_dir[0], z.ab_dir[1], framing, PEN_RAW * (penFactor(penWeight()) - penFactor(300))]);
    set(SLOT.frame, core);
    const fl = flares(m);
    set(SLOT.fl0, fl[0]);
    set(SLOT.fl1, fl[1]);
    set(SLOT.fl2, fl[2]);
    set(SLOT.ink, INK);
    set(SLOT.paper, PAPER);
    set(SLOT.accent, ACCENT);
    // panes: none, no glass
    set(SLOT.glass, [CONTROL_RADIUS * DPR, lift, 1e12, 0]); // the line fully drawn
    STOPS.forEach((c, i) => set(SLOT.stops + i, c));
    return u;
}

async function setup() {
    const [vs, fsPlate, fsOptics] = await Promise.all(
        ["gen/vs.vert", "gen/plate.frag", "gen/optics.frag"].map(async (f) => (await fetch(f)).text()),
    );
    const plate = program(vs, fsPlate), optics = program(vs, fsOptics);
    const ubo = gl.createBuffer();
    gl.bindBuffer(gl.UNIFORM_BUFFER, ubo);
    for (const p of [plate, optics]) {
        const block = gl.getUniformBlockIndex(p, "U_block_0Fragment");
        if (block !== gl.INVALID_INDEX) gl.uniformBlockBinding(p, block, 0);
    }
    gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, ubo);

    const empty = texture(1, 1, gl.RGBA, gl.RGBA8, new Uint8Array(4), gl.NEAREST);
    const face = portrait ? texture(256, 256, gl.RED, gl.R8, portrait) : texture(1, 1, gl.RED, gl.R8, new Uint8Array(1));
    const engraved = texture(W, H, gl.RGBA, gl.RGBA8, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, engraved, 0);
    gl.bindVertexArray(gl.createVertexArray());
    gl.viewport(0, 0, W, H);
    return { plate, optics, ubo, empty, face, engraved, fbo };
}

function draw(s, m) {
    gl.bindBuffer(gl.UNIFORM_BUFFER, s.ubo);
    gl.bufferData(gl.UNIFORM_BUFFER, uniforms(m), gl.STATIC_DRAW);

    // pass 1: the engraving
    gl.bindFramebuffer(gl.FRAMEBUFFER, s.fbo);
    gl.useProgram(s.plate);
    bindSampler(s.plate, "_group_0_binding_1_fs", 0, s.empty); // the title atlas: nothing written
    bindSampler(s.plate, "_group_0_binding_3_fs", 1, s.empty); // its segment table
    bindSampler(s.plate, "_group_0_binding_4_fs", 2, s.face);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // pass 2: the optics over it, to the canvas
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(s.optics);
    bindSampler(s.optics, "_group_1_binding_0_fs", 3, s.engraved);
    bindSampler(s.optics, "_group_0_binding_4_fs", 2, s.face);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.finish();
}

const shown = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

try {
    await document.fonts.load('400 64px "Newsreader"');
    await document.fonts.load('italic 400 24px "Newsreader"');
    await document.fonts.load('500 15px "Inter"');
    await loadPortrait();
    setText();
    const scene = await setup();
    draw(scene, still());
    // the loop's generator (scripts/og-loop.ts) asks for frame k of n, and waits for it to show
    window.__cardLoop = (k, n, seconds, deals, pace) => {
        draw(scene, turning(k, n, seconds, deals, pace));
        return shown();
    };
    await shown();
    window.__cardReady = true;
} catch (err) {
    window.__cardError = String((err && err.message) || err);
    console.error("card:", err);
}
