// Greeting: written in script on the plate, then lifted, tail first, onto the plate's own
// spiral and reeled in along it, the reverse of the way the plate's pen will draw it: the
// words stay words the whole way, written at the plate's lettering size, thinning into the
// line over the last turn, and go in at the point the line starts from. The plate then
// draws its line out of that point along the curve the words came in on.
// Drawn into the plate's engraving (colour over it, plus ink amount), so the
// plate's optics fall on it too.
//
// The ribbon is one triangle strip indexed by `u`, atlas px along the text
// (0..text_len). Each vertex knows its place in the text block (`pa`) and
// computes its place on the spiral.

struct U {
    res: vec2<f32>,
    t: f32,          // seconds since the greeting began
    s_a: f32,        // device px per atlas px, text block
    yc: f32,         // atlas y of the band centre (x-height middle)
    atlas_h: f32,
    atlas_w: f32,
    head: f32,       // write head, atlas px
    hair: f32,       // stroke width, device px
    text_len: f32,
    fall_t0: f32,    // when the sentence starts to fall
    sink: f32,       // the plate's spiral start, y down from the middle
    ink: vec4<f32>,
    coil: vec4<f32>, // x: the plate's turn spacing, device px; y: device px per atlas px on it
};

@group(0) @binding(0) var<uniform> u: U;
@group(0) @binding(1) var atlas: texture_2d<f32>;
@group(0) @binding(2) var samp: sampler;

const PI: f32 = 3.14159265359;
const TAU: f32 = 6.28318530718;
// keep in step with intro.rs FALL: the sentence lifts onto the spiral (the end of it first,
// the start STAGGER later, each point over GATHER), and the reel starts winding it in at REEL_AT
// and has it all in the point REEL later
const GATHER: f32 = 1.0;
const STAGGER: f32 = 0.45;
const REEL_AT: f32 = 1.0;
const REEL: f32 = 1.5;
// the plate's line starts half a turn out (plate.wgsl: its turn 0 is r = d/2, on the left)
const START: f32 = 0.5;
// the sentence rests with its start this many turns out, so "Hi," is read on the spiral
// before it goes in
const REST_TURN: f32 = 1.5;
// inside this turn the words thin into the line, a hairline by the point
const THIN_FROM: f32 = 1.5;

struct VIn {
    @location(0) u: f32,
    @location(1) side: f32,
    @location(2) pa: vec2<f32>,
    @location(3) gap: f32,
    @location(4) k: f32,
};

struct VOut {
    @builtin(position) pos: vec4<f32>,
    @location(0) uv: vec2<f32>,
    @location(1) p: f32,
    @location(2) off: f32,
    @location(3) along: f32,
    @location(4) gap: f32,
    @location(5) k: f32,
    @location(6) past: f32,
};

@vertex
fn vs_main(v: VIn) -> VOut {
    let v_atlas = select(u.atlas_h, 0.0, v.side < 0.0);
    let band = u.yc - v_atlas;
    var o: VOut;
    o.uv = vec2<f32>(v.u / u.atlas_w, v_atlas / u.atlas_h);
    o.k = v.k;
    o.along = v.u;
    o.gap = v.gap;
    let d = u.coil.x;
    let s_c = u.coil.y;
    let lt = u.t - u.fall_t0;
    // in the block: where the greeting was written
    let block = v.pa + vec2<f32>(0.0, -1.0) * band * u.s_a * v.k;
    // on the spiral: the plate's own line round the sink (plate.wgsl: r = d·tc, the turn TAU·tc
    // counter-clockwise from the right, arc π·d·tc²), the sentence laid along it by arc length,
    // its start innermost; `lead` atlas px of it are already reeled in through the point
    let s_start = PI * d * START * START;
    let s_rest = PI * d * REST_TURN * REST_TURN;
    let rp = clamp((lt - REEL_AT) / REEL, 0.0, 1.0);
    // the reel runs until the last of the sentence is at the point
    let lead = rp * rp * (3.0 - 2.0 * rp) * (u.text_len + (s_rest - s_start) / s_c);
    let past = s_rest + (v.u - lead) * s_c - s_start;
    let s = s_start + max(past, 0.0);
    let tc = sqrt(s / (PI * d));
    let th = TAU * tc;
    let r = d * tc;
    let radial = vec2<f32>(cos(th), -sin(th));
    let dir = normalize(radial * (d / TAU) + vec2<f32>(-sin(th), -cos(th)) * r);
    let up = vec2<f32>(dir.y, -dir.x);
    // written thinner as it nears the point, never thinner than the stroke itself
    let near = smoothstep(START, THIN_FROM, tc);
    let sc = max(s_c * mix(0.3, 1.0, near), 1.5 * u.hair / max(u.yc, u.atlas_h - u.yc));
    let spiral = vec2<f32>(0.0, u.sink) + r * radial + up * band * sc;
    // each point lifts from the block onto the spiral, the end of the sentence first: it goes
    // to the outer turn, out of the way of the words that follow it down
    let la = clamp((lt - STAGGER * (1.0 - v.u / u.text_len)) / GATHER, 0.0, 1.0);
    let lift = la * la * la * (la * (la * 6.0 - 15.0) + 10.0);
    let p2 = mix(block, spiral, lift);
    // how far into the point: the letters give way to the line there
    o.p = lift * (1.0 - near);
    o.off = band * mix(u.s_a * v.k, sc, lift);
    o.past = past;
    o.pos = vec4<f32>(p2.x * 2.0 / u.res.x, -p2.y * 2.0 / u.res.y, 0.0, 1.0);
    return o;
}

@fragment
fn fs_main(i: VOut) -> @location(0) vec4<f32> {
    // smaller lines are written with a slightly fuller pen, so their hairlines hold
    let cov = smoothstep(0.0, mix(0.55, 1.0, (i.k - 0.5) * 2.0), textureSample(atlas, samp, i.uv).r);
    // what has gone in through the point is gone
    let in_text = step(0.0, i.along) * step(i.along, u.text_len) * step(0.0, i.past);
    let pen = clamp((u.head - i.along) / 6.0, 0.0, 1.0);
    // a row break is a seam stretched between rows: it never carries ink
    let seam = 1.0 - step(0.001, i.gap);
    let glyph = cov * in_text * pen * seam * (1.0 - smoothstep(0.7, 0.97, i.p));

    // the letters' joining stroke takes over only once they're too small to read: the plate's
    // own line, which the plate draws out over it from the point
    let drawn = smoothstep(0.6, 0.9, i.p) * in_text;
    let hw = 0.5 * u.hair * drawn;
    let line = clamp(hw - abs(i.off) + 0.5, 0.0, 1.0) * step(0.02, hw) * seam;

    return vec4<f32>(u.ink.rgb, max(glyph, line));
}
