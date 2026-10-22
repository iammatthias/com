// Greeting: written in script on the plate, then lifted, head first, onto one
// spiral round the point the plate's line starts from and reeled in along it: the
// words stay words the whole way, written smaller as they near the middle, where
// each letter thins into the line. The plate then draws its line out of that point.
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
    sink: f32,       // where everything falls to: the plate's spiral start, y down from the middle
    ink: vec4<f32>,
};

@group(0) @binding(0) var<uniform> u: U;
@group(0) @binding(1) var atlas: texture_2d<f32>;
@group(0) @binding(2) var samp: sampler;

const PI: f32 = 3.14159265359;
const TAU: f32 = 6.28318530718;
// keep in step with intro.rs FALL: the sentence lifts onto the spiral (the start of it first,
// the end STAGGER later, each point over GATHER), and the reel starts winding it in at REEL_AT
// and has it all in the centre REEL later
const GATHER: f32 = 1.0;
const STAGGER: f32 = 0.45;
const REEL_AT: f32 = 0.7;
const REEL: f32 = 1.5;
// the words on the spiral, against their size in the block; and the turns' spacing, in bands
// of script (a line of it and a little air)
const REEL_SCALE: f32 = 0.5;
const TURN_BANDS: f32 = 1.15;
const START_TURNS: f32 = 1.0;
// how far through the reel the coil starts closing on the sink
const CLOSE_AT: f32 = 0.55;

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
    let c = vec2<f32>(0.0, u.sink);
    let lt = u.t - u.fall_t0;
    // in the block: where the greeting was written
    let block = v.pa + vec2<f32>(0.0, -1.0) * band * u.s_a * v.k;
    // on the spiral: an Archimedean turn round the sink, the sentence laid along it by arc
    // length, its start innermost; `lead` atlas px of it are already reeled into the centre
    let s_c = u.s_a * REEL_SCALE;
    let d_f = u.atlas_h * s_c * TURN_BANDS;
    let rp = clamp((lt - REEL_AT) / REEL, 0.0, 1.0);
    let lead = rp * rp * (3.0 - 2.0 * rp) * (u.text_len + 0.25 * u.atlas_h);
    // the sentence starts a turn out, so "Hi," is read on the spiral before it goes in; what
    // the reel has passed slides the last turn into the centre (same speed at the hand-over)
    let s0 = PI * d_f * START_TURNS * START_TURNS;
    let ahead = (v.u - lead) * s_c;
    let s = select(s0 * exp(ahead / s0), s0 + ahead, ahead >= 0.0);
    let tc = sqrt(s / (PI * d_f));
    let th = TAU * tc;
    // the last of it doesn't stop a turn out: the whole coil draws tight into the sink,
    // quickening, so the plate's line can start from the point it closes on
    let cq = clamp((rp - CLOSE_AT) / (1.0 - CLOSE_AT), 0.0, 1.0);
    let close = 1.0 - cq * cq;
    let r = d_f * tc * close;
    let radial = vec2<f32>(cos(th), -sin(th));
    let dir = normalize(radial * (d_f / TAU) + vec2<f32>(-sin(th), -cos(th)) * max(r, 1.0));
    let up = vec2<f32>(dir.y, -dir.x);
    // written smaller as it nears the middle, never thinner than the stroke itself
    let near = smoothstep(0.0, 1.6 * d_f, r);
    let sc = max(s_c * mix(0.3, 1.0, near) * close, 1.5 * u.hair / max(u.yc, u.atlas_h - u.yc));
    let spiral = c + r * radial + up * band * sc;
    // each point lifts from the block onto the spiral, the start of the sentence first
    let la = clamp((lt - STAGGER * v.u / u.text_len) / GATHER, 0.0, 1.0);
    let lift = la * la * la * (la * (la * 6.0 - 15.0) + 10.0);
    let p2 = mix(block, spiral, lift);
    // how far into the centre: the letters give way to the line there
    o.p = lift * (1.0 - near);
    o.off = band * mix(u.s_a * v.k, sc, lift);
    o.pos = vec4<f32>(p2.x * 2.0 / u.res.x, -p2.y * 2.0 / u.res.y, 0.0, 1.0);
    return o;
}

@fragment
fn fs_main(i: VOut) -> @location(0) vec4<f32> {
    // smaller lines are written with a slightly fuller pen, so their hairlines hold
    let cov = smoothstep(0.0, mix(0.55, 1.0, (i.k - 0.5) * 2.0), textureSample(atlas, samp, i.uv).r);
    let in_text = step(0.0, i.along) * step(i.along, u.text_len);
    let pen = clamp((u.head - i.along) / 6.0, 0.0, 1.0);
    // a row break is a seam stretched between rows: it never carries ink
    let seam = 1.0 - step(0.001, i.gap);
    let glyph = cov * in_text * pen * seam * (1.0 - smoothstep(0.7, 0.97, i.p));

    // the letters' joining stroke takes over only once they're too small to read
    // and gives way in turn to the plate's own line, drawn out of the point as the coil closes
    let handed = smoothstep(0.0, 0.3, u.t - u.fall_t0 - REEL_AT - REEL * CLOSE_AT);
    let drawn = smoothstep(0.6, 0.9, i.p) * in_text * (1.0 - handed);
    let hw = 0.5 * u.hair * drawn;
    let line = clamp(hw - abs(i.off) + 0.5, 0.0, 1.0) * step(0.02, hw) * seam;

    return vec4<f32>(u.ink.rgb, max(glyph, line));
}
