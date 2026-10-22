// The Burin plate: one engraved line spiralling out from the centre, swelling
// with the tone of its subject and turning into the site's titles in script.
// A WGSL port of the Burin Spiral artifact: same geometry, lettering, optics.
//
// Coordinates follow the artifact: `fc` is device px with y up.

struct U {
    rtd: vec4<f32>,     // res.xy, t, d (line spacing)
    line: vec4<f32>,    // bias, warp, disp, font_ref
    script: vec4<f32>,  // em, row_c, hair, text_len
    sheet: vec4<f32>,   // atlas_w, atlas_h, row_w, row_stride
    rows: vec4<f32>,    // row_pad, row_h, zoom, t_off
    view: vec4<f32>,    // pan.xy, hover.xy (atlas px of the hovered title's middle)
    wph: vec4<f32>,
    wfq: vec4<f32>,
    mph: vec4<f32>,     // mph.xyz, flow (turns the line sits further out; 0 on the site)
    optics: vec4<f32>,  // avoid, flare, haze, ab
    clocks: vec4<f32>,  // dpr, ab_freq, ab_clock, reveal
    ab_ph: vec4<f32>,
    pen: vec4<f32>,     // ab_dir.xy, frame (0 spiral … 1 framing the page), pen (atlas px added to the script's outline)
    frame: vec4<f32>,   // the core the line winds around, plate device px (y up): centre.xy, half-size.xy
    fl0: vec4<f32>,
    fl1: vec4<f32>,
    fl2: vec4<f32>,
    ink: vec4<f32>,
    paper: vec4<f32>,
    accent: vec4<f32>,
    panes: array<vec4<f32>, 4>, // controls floating on the plate: centre.xy, half.xy (device px, y up)
    glass: vec4<f32>,   // pane corner radius (device px), spiral lift (device px, y up), pen (arc px drawn), optics (1 under a greeting)
    stops: array<vec4<f32>, 5>, // sections' colours: @com's selection stops
};

@group(0) @binding(0) var<uniform> u: U;
@group(0) @binding(1) var atlas: texture_2d<f32>;
@group(0) @binding(2) var samp: sampler;
@group(0) @binding(3) var segs: texture_2d<f32>;
// the subject: a portrait's darkness (1 = deepest shadow), square, centred on the spiral
@group(0) @binding(4) var portrait: texture_2d<f32>;
// the engraving, rendered once per frame by fs_plate and read by fs_optics
@group(1) @binding(0) var engraved: texture_2d<f32>;

const TAU: f32 = 6.28318530718;
const PI: f32 = 3.14159265359;

fn res() -> vec2<f32> { return u.rtd.xy; }
fn ut() -> f32 { return u.rtd.z; }
fn ud() -> f32 { return u.rtd.w; }
fn zoom() -> f32 { return u.rows.z; }
fn pan() -> vec2<f32> { return u.view.xy; }
fn text_len() -> f32 { return u.script.w; }
fn reveal() -> f32 { return u.clocks.w; }
// how present the optics are: with the plate as it rises, or whole from the first frame of a greeting
fn optic() -> f32 { return max(reveal(), u.glass.w); }

fn fmod(x: f32, y: f32) -> f32 { return x - y * floor(x / y); }

// where the spiral starts on screen (device px, y up): above the middle, so the line winds out
// of the portrait's forehead; the portrait itself stays centred (plate/ LIFT)
fn origin() -> vec2<f32> { return 0.5 * res() + vec2<f32>(0.0, u.glass.y); }

@vertex
fn vs_main(@builtin(vertex_index) i: u32) -> @builtin(position) vec4<f32> {
    let p = vec2<f32>(f32((i << 1u) & 2u), f32(i & 2u));
    return vec4<f32>(p * 2.0 - 1.0, 0.0, 1.0);
}

fn framing() -> f32 { return u.pen.z; }

// The line winds around a core box: a point for the home spiral, the reading column
// for a page. Contours at distance d are rounded rects with corner radius d, so a
// zero-size core gives exactly the Archimedean spiral.
fn core_dist(q: vec2<f32>) -> f32 {
    let dq = abs(q) - u.frame.zw;
    return length(max(dq, vec2<f32>(0.0))) + min(max(dq.x, dq.y), 0.0);
}

// how far round the contour through q we are, 0..1, counter-clockwise from the left
// (for a zero-size core this is the artifact's a/2π + 0.5)
fn core_turn(q: vec2<f32>, d: f32) -> f32 {
    let b = u.frame.zw;
    let total = 4.0 * (b.x + b.y) + TAU * d;
    var l: f32;
    if (q.x < -b.x && abs(q.y) <= b.y) {
        l = select(total - q.y, -q.y, q.y <= 0.0);
    } else if (q.x < -b.x && q.y < -b.y) {
        l = b.y + d * (atan2(q.y + b.y, q.x + b.x) + PI);
    } else if (abs(q.x) <= b.x && q.y < 0.0) {
        l = b.y + d * PI * 0.5 + (q.x + b.x);
    } else if (q.x > b.x && q.y < -b.y) {
        l = b.y + d * PI * 0.5 + 2.0 * b.x + d * (atan2(q.y + b.y, q.x - b.x) + PI * 0.5);
    } else if (q.x > b.x && abs(q.y) <= b.y) {
        l = b.y + d * PI + 2.0 * b.x + (q.y + b.y);
    } else if (q.x > b.x && q.y > b.y) {
        l = 3.0 * b.y + d * PI + 2.0 * b.x + d * atan2(q.y - b.y, q.x - b.x);
    } else if (abs(q.x) <= b.x && q.y > 0.0) {
        l = 3.0 * b.y + d * PI * 1.5 + 2.0 * b.x + (b.x - q.x);
    } else {
        l = 3.0 * b.y + d * PI * 1.5 + 4.0 * b.x + d * (atan2(q.y - b.y, q.x + b.x) - PI * 0.5);
    }
    return clamp(l / max(total, 1e-3), 0.0, 1.0);
}

// arc length along the line to the middle of a turn, and back: s = Q·tc + π·d·tc²
fn arc_of(tc: f32) -> f32 {
    return 4.0 * (u.frame.z + u.frame.w) * tc + PI * ud() * tc * tc;
}
fn turn_of(s: f32) -> f32 {
    let q = 4.0 * (u.frame.z + u.frame.w);
    let a = PI * ud();
    return (-q + sqrt(q * q + 4.0 * a * max(s, 0.0))) / (2.0 * a);
}

// half the portrait's side, in units of the shorter screen side
const SUBJECT: f32 = 0.264;
// line spacings of clear paper kept between the head and the first titles (plate/ FACE_CLEAR)
const FACE_CLEAR: f32 = 1.5;

// the subject: a portrait, engraved by tone
fn tone(q0: vec2<f32>) -> f32 {
    let q = q0 + vec2<f32>(0.0, u.glass.y / min(res().x, res().y));
    let inside = step(abs(q.x), SUBJECT) * step(abs(q.y), SUBJECT);
    let st = vec2<f32>(0.5) + vec2<f32>(q.x, -q.y) / (2.0 * SUBJECT);
    // the same tone on either paper: dark paper only swaps the colours (inverting the tone would
    // turn the empty ground into the deepest shadow, solid ink round every title)
    let d = mix(0.06, textureSampleLevel(portrait, samp, st, 0.0).r, inside);
    return clamp(d, 0.04, 0.95);
}

fn warp_f(q: vec2<f32>, qr: f32, a: f32, t: f32) -> f32 {
    return sin(q.x * 5.1 * u.wfq.x + t * 0.4 + u.wph.x) * sin(q.y * 4.3 * u.wfq.y - t * 0.33 + u.wph.y)
        + 0.6 * sin(a * u.wfq.z + qr * 9.0 - t * 0.27 + u.wph.z)
        + 0.35 * sin(a * u.wfq.w - qr * 14.0 + t * 0.21 + u.wph.w);
}

fn hash(p: vec2<f32>) -> f32 { return fract(sin(dot(p, vec2<f32>(127.1, 311.7))) * 43758.5453); }

// an integer hash (pcg3d) for grain: even at screen-sized coordinates it shows no pattern, which
// the sine hash above does in 32-bit floats. Three independent values in 0..1
fn grain3(p: vec2<f32>, frame: f32) -> vec3<f32> {
    var v = vec3<u32>(vec3<i32>(i32(floor(p.x)), i32(floor(p.y)), i32(frame)));
    v = v * 1664525u + 1013904223u;
    v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
    v = v ^ (v >> vec3<u32>(16u));
    v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
    return vec3<f32>(v) / 4294967295.0;
}

// how much of the title at arc length s is written: 0 = all line, 1 = fully lettered
fn morph_at(s: f32) -> f32 {
    let d = ud();
    let sg = s / d;
    let mm = sin(sg * 0.011 * u.mph.z - ut() + u.mph.x) + 0.55 * sin(sg * 0.027 * u.mph.z + ut() * 0.63 + u.mph.y) + u.line.x;
    let tn = turn_of(s) - 0.5;
    // the timeline (written from its start: rows.w < 0) is always lettered for its first turns,
    // the wave easing in after them, so the newest titles are what the centre shows
    let t0 = turn_of(-u.rows.w * d * u.script.x / u.line.w) - 0.5;
    let held = step(u.rows.w, -0.001) * (1.0 - smoothstep(t0 + 1.5, t0 + 3.0, tn));
    // the first turns stay plain line: six round the subject, one round a page
    let rf = max(clamp((mm + 0.3) / 0.6, 0.0, 1.0), held) * step(mix(6.0, 1.0, framing()), tn);
    // keep titles off the subject: where this title sits on the spiral, inside the portrait's
    // oval (centred below the spiral's start), as the artifact checks it against its image
    let mn = min(res().x, res().y);
    let rad = d * (tn + 0.5);
    let ang = (fract(tn) - 0.5) * TAU;
    let at = (rad * vec2<f32>(cos(ang), sin(ang)) + vec2<f32>(0.0, u.glass.y)) / mn;
    let oval = length(at / vec2<f32>(SUBJECT * 0.82, SUBJECT * 1.02));
    // and a clear margin beyond it of about a turn and a half (FACE_CLEAR line spacings), so the
    // first titles don't crowd the head where the turns are wide (a phone)
    let pad = FACE_CLEAR * d / (SUBJECT * 0.9 * mn);
    let subj = smoothstep(1.12 + pad, 0.92 + pad, oval) * (1.0 - framing());
    return rf * (1.0 - u.optics.x * smoothstep(0.08, 0.3, subj)) * reveal();
}

// segment [start, end) in atlas px for a position along the text
fn seg_at(uu: f32) -> vec2<f32> {
    let w = fmod(uu, text_len());
    let row = floor(w / u.sheet.z);
    let x = floor(w - row * u.sheet.z);
    let t = floor(textureLoad(segs, vec2<i32>(i32(x), i32(row)), 0) * 255.0 + 0.5);
    return vec2<f32>(t.r * 256.0 + t.g, t.b * 256.0 + t.a) * 2.0;
}

// a title's colour from its code: 255 a heading (accent), 40·n a section's stop, 0 ink
// (rgb, and how much of it to lay over the ink)
fn title_colour(code: f32) -> vec4<f32> {
    let c = code * 255.0;
    if (c > 230.0) { return vec4<f32>(u.accent.rgb, 1.0); }
    let n = i32(round(c / 40.0));
    if (n >= 1 && n <= 5) { return vec4<f32>(u.stops[n - 1].rgb, 0.55); }
    return vec4<f32>(u.ink.rgb, 0.0);
}

// atlas px of signed distance either side of the lettering's outline (plate/ SPREAD)
const SPREAD: f32 = 8.0;

// ink of the lettering from its distance field: the pen widens the outline by `pen` atlas px,
// antialiased over one screen pixel (`k` atlas px)
fn pen_ink(v: f32, pen: f32, k: f32) -> f32 {
    let dist = (v * 255.0 - 128.0) / 127.0 * SPREAD;
    return clamp((dist + pen) / max(k, 1e-3) + 0.5, 0.0, 1.0);
}

// script sampled for one turn of the spiral (neighbour turns let ascenders overflow)
// returns glyph, heading, write mask, hovered
fn letters(turn_b: f32, f_b: f32, sc: f32) -> vec4<f32> {
    let d = ud();
    let tc = turn_b + 0.5;
    let s_arc = arc_of(tc);
    let u_raw = s_arc * sc + u.rows.w;
    let ly = u.script.y + (f_b - 0.5) * d * sc;
    let uu = fmod(u_raw, text_len());
    let sg = seg_at(uu);
    let mid = 0.5 * (sg.x + sg.y);
    let rf = morph_at(s_arc + (mid - uu) / sc);
    // pen position: letters exist only behind the write head
    // nothing before the first title (the timeline starts past the face: the turns inside are bare)
    let m = clamp((rf * (sg.y - sg.x) - (uu - sg.x)) / (2.0 * sc / zoom()) + 0.5, 0.0, 1.0) * step(0.001, rf) * step(0.0, turn_b) * step(0.0, u_raw);
    let row = floor(uu / u.sheet.z);
    let x = uu - row * u.sheet.z;
    let in_row = step(0.0, ly) * step(ly, u.rows.y);
    let asz = vec2<f32>(u.sheet.x, u.sheet.y);
    // atlas px per screen px is sc/zoom both along and across the line
    let lod = max(log2(max(sc / zoom(), 1e-4)), 0.0);
    let a = textureSampleLevel(atlas, samp, vec2<f32>(x, row * u.sheet.w + u.rows.x + ly) / asz, lod);
    // the title's colour code, unfiltered (a blend of two codes would be a third colour)
    let code = textureLoad(atlas, vec2<i32>(i32(clamp(x, 0.0, asz.x - 1.0)), i32(clamp(row * u.sheet.w + u.rows.x + u.rows.y * 0.5, 0.0, asz.y - 1.0))), 0).g;
    let hov = step(u.view.z - 1.0, mid) * step(mid, u.view.w + 1.0);
    return vec4<f32>(a.r * in_row, code, m, hov);
}

// the whole engraving at one screen position → colour (rgb) and ink amount (a)
fn plate(fc: vec2<f32>) -> vec4<f32> {
    let d = ud();
    let p = (fc - origin() - pan()) / zoom();
    let mn = min(res().x, res().y);
    let q = p / mn;
    let qr = length(q);
    let a = atan2(p.y, p.x);
    let pc = p - u.frame.xy;
    let dist = core_dist(pc);
    // the plate comes up out of the intro's bare spiral: tone, warp and lettering rise together;
    // round a page the subject gives way to an even light ground and the warp calms near the text
    let dark = mix(0.06, mix(tone(q), 0.1, framing()), reveal());
    let calm = mix(smoothstep(0.0, 0.12, qr), smoothstep(0.0, 6.0 * d, dist), framing());

    // inside a page's column there is only paper, at every stage of the frame opening
    if (dist < 0.0 && framing() > 0.001) {
        return vec4<f32>(u.paper.rgb, 0.0);
    }
    let rr = dist + d * (u.line.y * warp_f(q, qr, a, ut()) * calm + u.line.z * (dark - 0.5)) * reveal();
    let an = core_turn(pc, max(rr, 0.0));
    let tt0 = rr / d - an;
    let turn0 = floor(tt0) + an;
    // the social loop's flow (card.js): the line mph.w of a turn further out. A whole turn maps
    // the spiral onto itself, so a phase run from 0 to 1 flows the line outward and back to the
    // start; the site draws at 0
    let tt = tt0 - u.mph.w;
    let kk = floor(tt);
    let f = tt - kk;
    let turn = kk + an;
    // drawn only behind the pen while the line comes out of the greeting's point; the drawn
    // region stays put while the line flows through it
    let pen_at = arc_of(turn0 + 0.5);
    let alive = step(0.0, turn0) * clamp((u.glass.z - pen_at) / (1.5 * d) + 0.5, 0.0, 1.0);
    let vy = (f - 0.5) * d;

    let sc = u.line.w / (d * u.script.x);

    // centre turn: which title or gap are we in, and are its neighbours lettered?
    let tc = turn + 0.5;
    let s_arc = arc_of(tc);
    let u0 = fmod(s_arc * sc + u.rows.w, text_len());
    let sg = seg_at(u0);
    let pv = seg_at(sg.x - 1.0);
    var pm = 0.5 * (pv.x + pv.y);
    if (pm > sg.x) { pm = pm - text_len(); }
    let nx = seg_at(sg.y);
    var nm = 0.5 * (nx.x + nx.y);
    if (nm < sg.y) { nm = nm + text_len(); }
    let m_p = morph_at(s_arc + (pm - u0) / sc);
    let m_n = morph_at(s_arc + (nm - u0) / sc);
    let d_s = (u0 - sg.x) / sc;
    let d_e = (sg.y - u0) / sc;
    let taper = max(m_p * (1.0 - smoothstep(0.0, 3.5 * d, d_s)), m_n * (1.0 - smoothstep(0.0, 3.5 * d, d_e))) * step(0.0, s_arc * sc + u.rows.w);

    // engraved stroke: swells with tone, thins to a hairline where it runs into script
    var w = 0.5 * d * mix(0.04, 1.0, dark);
    w = mix(w, max(0.5 * u.script.z / sc, 0.45), taper);
    let stroke = clamp((w - abs(vy)) * zoom() + 0.5, 0.0, 1.0);

    let l0 = letters(turn, f, sc);
    let lo = letters(turn + 1.0, f - 1.0, sc);
    let li = letters(turn - 1.0, f + 1.0, sc);
    let m0 = l0.z * alive;

    // the pen: the seed's weight, pressed harder in the dark of the subject and under the pointer
    let k_px = sc / zoom();
    let pen = u.pen.w + 0.3 * dark;
    let g0 = pen_ink(l0.x, pen + 0.9 * l0.w, k_px) * m0;
    let go = pen_ink(lo.x, pen + 0.9 * lo.w, k_px) * lo.z;
    let gi = pen_ink(li.x, pen + 0.9 * li.w, k_px) * li.z * step(1.0, turn);
    let glyph = max(g0, max(go, gi));
    // whichever turn's letter is inked here lends its title's colour
    var code = l0.y;
    if (go > g0 && go >= gi) { code = lo.y; } else if (gi > g0 && gi > go) { code = li.y; }
    let hue = title_colour(code);
    let head = hue.a;

    // dark tone: script reversed out of a solid band; light tone: ink script on paper
    let wb = 0.5 * d * smoothstep(0.3, 0.95, dark);
    // (a band of no width is no band: without the fade its half-pixel antialiasing leaves a
    // hairline down the middle of every title on light paper)
    let band = clamp((wb - abs(vy)) * zoom() + 0.5, 0.0, 1.0) * clamp(wb * zoom(), 0.0, 1.0) * m0;
    let txt = glyph * (1.0 - band) + (1.0 - glyph) * band;
    let hov = l0.w * m0 * step(abs(vy), 0.5 * d);

    let s_cov = stroke * (1.0 - m0) * alive;
    var col = u.paper.rgb;
    col = mix(col, mix(u.paper.rgb, u.accent.rgb, 0.13), hov);
    col = mix(col, u.ink.rgb, s_cov);
    col = mix(col, mix(u.ink.rgb, hue.rgb, head * (1.0 - band)), txt);
    let ink = clamp(max(s_cov, txt * (1.0 - head * 0.4)), 0.0, 1.0);
    return vec4<f32>(col, ink);
}

// ---- optics: chaotic, seeded chromatic aberration and spectral quirks ----
fn spectrum(h: f32) -> vec3<f32> {
    return clamp(abs(fract(h + vec3<f32>(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0) - 1.0, vec3<f32>(0.0), vec3<f32>(1.0));
}
fn vnoise(x: vec2<f32>) -> f32 {
    let i = floor(x);
    var f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    let a = hash(i);
    let b = hash(i + vec2<f32>(1.0, 0.0));
    let c = hash(i + vec2<f32>(0.0, 1.0));
    let dd = hash(i + vec2<f32>(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, dd, f.x), f.y);
}
fn rot(a: f32) -> mat2x2<f32> {
    let c = cos(a);
    let s = sin(a);
    return mat2x2<f32>(c, -s, s, c);
}
fn ab_off(fc: vec2<f32>) -> vec2<f32> {
    let mn = min(res().x, res().y);
    let n = (fc - origin() - pan()) / (zoom() * mn);
    let rad = length(n);
    let ang = atan2(n.y, n.x);
    let t = ut() * 0.5 + u.clocks.z;
    let n1 = rot(t * 0.19 + u.ab_ph.x) * n;
    let n2 = rot(-t * 0.13 + rad * 2.6 + u.ab_ph.y) * n;
    let a1 = vnoise(n1 * 3.1 + u.ab_ph.zw);
    let a2 = vnoise(n2 * 5.7 - u.ab_ph.wz + t * 0.05);
    let pocket = smoothstep(0.42, 0.9, a1 * 0.65 + a2 * 0.55);
    let arms = pow(max(0.0, sin(ang * u.clocks.y + rad * u.pen.x * 9.0 - t * 0.7 + u.ab_ph.z)), 18.0);
    let flick = step(0.86, hash(floor(vec2<f32>(ang * 3.2 + t * 0.9, rad * 7.0 - t * 0.3)) + u.ab_ph.xy));
    let burst = 1.0 + 2.0 * pow(max(0.0, sin(t * 0.83 + u.ab_ph.y) * sin(t * 0.31 + u.ab_ph.z)), 6.0);
    let phi = (a2 - 0.5) * 6.28 + ang;
    let dir = vec2<f32>(cos(phi), sin(phi));
    let mag = rad * rad * 0.9 + pocket * 0.9 + arms * 1.3 + flick * 0.8;
    return dir * mag * burst * u.optics.w * 6.0 * u.clocks.x;
}

// anamorphic flare from one light source: wide streak, warm core, spectral ghost through the centre
fn flare(fc: vec2<f32>, src: vec2<f32>, k: f32, hue: f32) -> vec3<f32> {
    let dpr = u.clocks.x;
    let dd = fc - src;
    let wd = res().x;
    let streak = exp(-abs(dd.y) / (2.2 * dpr)) * exp(-abs(dd.x) / (0.42 * wd)) + 0.8 * exp(-abs(dd.y) / (0.7 * dpr)) * exp(-abs(dd.x) / (0.1 * wd));
    let core = exp(-dot(dd, dd) / (2.0 * pow(16.0 * dpr, 2.0)));
    let halo = exp(-dot(dd, dd) / (2.0 * pow(70.0 * dpr, 2.0)));
    let g = fc - (res() - src);
    let ghost = smoothstep(1.0, 0.55, length(g * vec2<f32>(0.55, 1.25)) / (46.0 * dpr)) * 0.35;
    let c = vec3<f32>(0.18, 0.55, 1.0) * streak + vec3<f32>(1.0, 0.88, 0.72) * core * 1.4 + vec3<f32>(1.0, 0.3, 0.18) * halo * 0.35 * u.optics.z + spectrum(hue) * ghost;
    return c * k;
}

// pass 1: the engraving itself, colour and ink amount
@fragment
fn fs_plate(@builtin(position) pos: vec4<f32>) -> @location(0) vec4<f32> {
    return plate(vec2<f32>(pos.x, res().y - pos.y));
}

// the engraving at a plate position (y up), read back from pass 1
fn engraved_at(fc: vec2<f32>) -> vec4<f32> {
    let uv = vec2<f32>(fc.x, res().y - fc.y) / res();
    return textureSampleLevel(engraved, samp, uv, 0.0);
}

// ---- glass: the controls float on the plate as rounded panes ----
fn pane_sdf(fc: vec2<f32>, p: vec4<f32>) -> f32 {
    let r = min(u.glass.x, min(p.z, p.w));
    let q = abs(fc - p.xy) - p.zw + vec2<f32>(r);
    return length(max(q, vec2<f32>(0.0))) + min(max(q.x, q.y), 0.0) - r;
}

// the nearest pane: signed distance (device px), outward normal, and its centre
struct Pane {
    d: f32,
    n: vec2<f32>,
    c: vec2<f32>,
};

fn nearest_pane(fc: vec2<f32>) -> Pane {
    var best = Pane(1e9, vec2<f32>(0.0), vec2<f32>(0.0));
    for (var i = 0; i < 4; i = i + 1) {
        let p = u.panes[i];
        if (p.z <= 0.0) { continue; }
        let d = pane_sdf(fc, p);
        if (d < best.d) {
            let e = vec2<f32>(1.0, 0.0);
            let g = vec2<f32>(pane_sdf(fc + e.xy, p) - pane_sdf(fc - e.xy, p), pane_sdf(fc + e.yx, p) - pane_sdf(fc - e.yx, p));
            best = Pane(d, g / max(length(g), 1e-4), p.xy);
        }
    }
    return best;
}

// the engraving seen through frosted glass: a small disk of taps
fn frosted(fc: vec2<f32>, radius: f32) -> vec4<f32> {
    var acc = engraved_at(fc) * 2.0;
    for (var i = 0; i < 8; i = i + 1) {
        let a = f32(i) * 0.785398 + 0.39;
        acc = acc + engraved_at(fc + radius * vec2<f32>(cos(a), sin(a)));
    }
    return acc / 10.0;
}

// pass 2: optics over the engraving: dispersion, sheen, leaks, halation, flares, grain
@fragment
fn fs_optics(@builtin(position) pos: vec4<f32>) -> @location(0) vec4<f32> {
    let fc0 = vec2<f32>(pos.x, res().y - pos.y);
    let mn = min(res().x, res().y);
    let n = (fc0 - 0.5 * res()) / mn;
    let t = ut() * 0.5 + u.clocks.z;
    let dpr = u.clocks.x;

    // glass: inside a pane the plate is seen through a thick, frosted lens. Toward the rim it
    // bends inward (the rim shows what lies just beyond it); the middle is gently magnified
    let pane = nearest_pane(fc0);
    let inside = clamp(0.5 - pane.d, 0.0, 1.0);
    let lip = smoothstep(-14.0 * dpr, 0.0, pane.d) * inside;
    var fc = fc0;
    if (inside > 0.0) {
        fc = pane.c + (fc0 - pane.c) * 0.94 + pane.n * lip * lip * 20.0 * dpr;
    }

    // round a page the optics stay out in the margins: the column is clean paper for reading
    // (but glass carries its own optics wherever it floats)
    let pp = (fc - origin() - pan()) / zoom();
    // inside it at a gentler strength: the paper keeps its light and grain under the text
    let clear = mix(1.0, mix(0.5, 1.0, smoothstep(-0.25 * ud(), 1.5 * ud(), core_dist(pp - u.frame.xy))), framing());
    let rv = max(optic() * clear, inside * optic());
    // the glass amplifies the dispersion of what lies under it
    let ab = u.optics.w * rv * (1.0 + 1.6 * inside);
    var c0: vec4<f32>;
    var cr: vec4<f32>;
    var cb: vec4<f32>;
    var col: vec3<f32>;
    if (ab < 0.001) {
        c0 = engraved_at(fc);
        if (inside > 0.0) { c0 = frosted(fc, 7.0 * dpr); }
        cr = c0;
        cb = c0;
        col = c0.rgb;
    } else {
        let off = ab_off(fc) * rv * (1.0 + 1.6 * inside);
        let perp = vec2<f32>(-off.y, off.x);
        cr = engraved_at(fc + off);
        c0 = engraved_at(fc);
        if (inside > 0.0) { c0 = mix(c0, frosted(fc, 7.0 * dpr), inside); }
        cb = engraved_at(fc - off * 1.25 + perp * 0.3);
        col = vec3<f32>(cr.r, c0.g, cb.b);
        let film = smoothstep(0.15, 0.9, 0.5 + 0.5 * sin(n.x * 3.1 + u.ab_ph.z + t * 0.4) * sin(n.y * 2.3 - t * 0.27 + u.ab_ph.w));
        let sheen = spectrum(length(fc - origin() - pan()) / (ud() * zoom() * 9.0) - t * 0.06 + u.ab_ph.x) * dot(col, vec3<f32>(0.3, 0.5, 0.2)) * 1.9;
        col = mix(col, sheen, c0.a * film * ab * 0.42);
        let leak = smoothstep(0.55, 1.0, sin(n.x * 1.9 + u.ab_ph.y + t * 0.21) * 0.5 + sin(n.y * 1.4 - t * 0.17 + u.ab_ph.x) * 0.5 + 0.3);
        col = col * mix(vec3<f32>(1.0), 0.55 + 0.7 * spectrum(n.x * 0.35 - n.y * 0.2 + u.ab_ph.z * 0.16 + t * 0.02), leak * ab * 0.34 * (1.0 - c0.a));
    }
    let dark_paper = step(dot(u.paper.rgb, vec3<f32>(0.3, 0.5, 0.2)), 0.5);

    // halation: shadows lift warm red, ink bleeds a red glow, a faint milky veil over all
    let haze = u.optics.z * rv;
    if (haze > 0.001) {
        let ink_soft = (c0.a + cr.a + cb.a) / 3.0;
        let red = vec3<f32>(1.0, 0.22, 0.12);
        col = mix(col, col + red * 0.16, haze * ink_soft * (1.0 - dark_paper));
        col = col + red * haze * 0.22 * ink_soft * dark_paper;
        col = mix(col, vec3<f32>(dot(u.paper.rgb, vec3<f32>(0.3, 0.5, 0.2))) * 0.5 + 0.5 * mix(u.paper.rgb, vec3<f32>(0.95, 0.9, 0.86), 0.5), haze * 0.07);
    }

    // anamorphic flares: seeded lights gliding along the line, so they come with the line (not
    // with a greeting, which has none for them to ride)
    let fl_k = u.optics.y * max(reveal() * clear, inside * reveal()) * (1.0 + 1.2 * inside);
    var spec = 0.0;
    if (fl_k > 0.001) {
        var fsum = vec3<f32>(0.0);
        let lights = array<vec4<f32>, 3>(u.fl0, u.fl1, u.fl2);
        for (var i = 0; i < 3; i = i + 1) {
            let l = lights[i];
            // riding the line: where it is on the plate comes from the CPU, which follows the line
            let src = origin() + pan() + zoom() * l.xy;
            let pulse = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(t * (0.7 + 0.3 * f32(i)) + l.z * 3.0), 2.0);
            fsum = fsum + flare(fc, src, pulse, l.w + t * 0.03);
            // the same lights catch the rim of the glass
            spec = spec + pulse * pow(max(dot(pane.n, normalize(src - fc0)), 0.0), 6.0);
        }
        fsum = fsum * fl_k;
        let screen = 1.0 - (1.0 - col) * (1.0 - clamp(fsum, vec3<f32>(0.0), vec3<f32>(1.0)));
        let fmax = max(fsum.r, max(fsum.g, fsum.b));
        let tinted = mix(col, fsum / max(fmax, 1e-3), clamp(fmax * 0.55, 0.0, 0.75));
        col = mix(tinted, screen, dark_paper);
    }
    if (inside > 0.0) {
        // frost: a paper veil, heavy in the middle where text sits, thin at the rim where the
        // refraction and the colour show through
        col = mix(col, u.paper.rgb, mix(0.84, 0.5, lip) * inside);
        // specular: a key light from the upper left, the flare lights, and a bright hairline edge
        let key = pow(max(dot(pane.n, normalize(vec2<f32>(-0.55, 0.83))), 0.0), 3.0);
        let edge = smoothstep(-2.4 * dpr, -0.4 * dpr, pane.d) * inside;
        let shine = (0.28 * key + 0.5 * spec * u.optics.y) * lip + 0.32 * edge;
        col = col + vec3<f32>(1.0, 0.98, 0.95) * shine * mix(0.55, 1.0, dark_paper);
    } else if (pane.d < 18.0 * dpr) {
        // a soft shadow under the pane on light paper, a faint glow on dark
        let s = (1.0 - smoothstep(0.0, 18.0 * dpr, pane.d)) * 0.07;
        col = mix(col * (1.0 - s), col + vec3<f32>(s * 0.5), dark_paper);
    }
    // film grain: fine silver at the screen's own pixels (sampled per CSS px it shows as 2x2
    // squares on a retina) with a little clumping from 2px cells, all but monochrome, strongest
    // in the mid-tones. Cut like film frames, 24 a second: a fresh deal each frame, no blending
    // between deals, on the control clock so a still plate keeps still grain
    let lum = dot(col, vec3<f32>(0.3, 0.5, 0.2));
    let body = mix(0.45, 1.0, clamp(4.0 * lum * (1.0 - lum), 0.0, 1.0)) * rv;
    let frame = floor(u.clocks.z * 2.5 * 24.0);
    let fine = grain3(fc0, frame);
    let clump = grain3(floor(fc0 / 2.0) + 913.0, frame);
    // sums of uniforms: close to normal, crisp because each grain is one sample
    let g = (fine.x + fine.y + fine.z - 1.5) * 0.8 + (clump.x + clump.y - 1.0) * 0.6;
    let grain = vec3<f32>(g * 1.9) * vec3<f32>(1.0, 0.985, 0.97);
    col = mix(col * (1.0 + grain * 0.12 * body), col + grain * 0.08 * body, dark_paper);
    return vec4<f32>(col, 1.0);
}
