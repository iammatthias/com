// Shader source extracted verbatim from the standalone azulejo prototype.
// vertSrc projects the fullscreen quad; fragSrc procedurally renders the tile.
// No template-literal interpolation is used — uniforms are bound on the JS side.

export const vertSrc = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
`;

export const fragSrc = `
  precision highp float;

  uniform float uCenter, uWrapper, uCorners, uEdges, uField, uFrame;
  uniform float uGround, uStraps;
  /* mutation slots — second motif merged with primary; -1.0 = no mutation */
  uniform float uCenter2, uWrapper2, uCornersB;
  uniform float uV1, uV2;
  uniform float uImp;
  uniform vec2  uIperf;
  uniform vec3  uBg, uOl, uC1, uC2, uC3;
  uniform vec3  uGrout;
  uniform vec2  uRes;

  varying vec2 vUv;

  #define PI  3.14159265359
  #define TAU 6.28318530718
  #define INF 1e9

  /* ───── noise / hash ───── */
  float hash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  vec2 hash22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(hash21(i+vec2(0,0)), hash21(i+vec2(1,0)), u.x),
               mix(hash21(i+vec2(0,1)), hash21(i+vec2(1,1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) {
      s += a * vnoise(p);
      p *= 2.03; a *= 0.5;
    }
    return s;
  }
  float vcrack(vec2 p) {
    vec2 ip = floor(p), fp = fract(p);
    float md1 = 8.0, md2 = 8.0;
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 g = vec2(float(i), float(j));
        vec2 o = hash22(ip + g);
        vec2 r = g + o - fp;
        float d = dot(r, r);
        if (d < md1) { md2 = md1; md1 = d; }
        else if (d < md2) { md2 = d; }
      }
    }
    return sqrt(md2) - sqrt(md1);
  }
  /* Pigment density — isotropic cloud variation, NO directional bias.
     This is what "wet vs dry pigment" looks like in real ceramic painting:
     organic blotches, never streaks. Replaces the old directional brushTex. */
  float pigmentDensity(vec2 p, vec2 off) {
    float a = fbm(p * 7.0 + off);
    float b = fbm(p * 21.0 + off * 1.7);
    return a * 0.65 + b * 0.35;
  }

  /* Localized brush patches — short bristle highlights confined to small
     cells, each with its own direction. Replaces the global bristleStreaks
     that used to span the whole tile in one direction.
     Cells overlap with falloff so there are no visible boundaries. */
  float brushPatches(vec2 p, vec2 off) {
    float k = 0.090;
    vec2 cell = floor((p + 100.0) / k);
    vec2 c = mod(p + 0.5 * k + 100.0, k) - 0.5 * k;
    /* per-cell stroke direction (inline rotation — rot() is defined later) */
    float ang = (hash21(cell + off) - 0.5) * PI;
    float ph  = hash21(cell + off + 7.3) * 50.0;
    float ca = cos(ang), sa = sin(ang);
    vec2 rc = vec2(ca * c.x - sa * c.y, sa * c.x + ca * c.y);
    /* short streak along rc.x */
    float streak = fbm(vec2(rc.x * 90.0 + ph, rc.y * 6.0));
    streak = smoothstep(0.62, 0.78, streak);
    /* falloff toward cell edges so patches blend rather than tile */
    float fx = 1.0 - smoothstep(k * 0.18, k * 0.45, abs(rc.x));
    float fy = 1.0 - smoothstep(k * 0.20, k * 0.45, abs(rc.y));
    /* 30% of cells empty for organic distribution */
    float keep = step(0.30, hash21(cell + off + 11.7));
    return streak * fx * fy * keep;
  }

  /* ───── AA / SDF utils ───── */
  float aapaint(float t, float v, vec2 p) {
    float w = fwidth(v) * (0.95 + 1.4 * vnoise(p * 45.0 + uIperf) * uImp);
    return smoothstep(t - w, t + w, v);
  }

  /* ───── Bayer 8x8 ordered dither ─────
     Returns a value in [-0.5, 0.5] from a Bayer matrix indexed by pixel
     coordinate.  Applied to the final color it breaks up smooth gradients
     and gives the surface a tactile, half-tone-like grain that reads as
     ceramic texture rather than digital flatness. */
  float bayer8(vec2 frag) {
    int x = int(mod(frag.x, 8.0));
    int y = int(mod(frag.y, 8.0));
    int i = x + y * 8;
    /* unrolled 8x8 Bayer matrix, normalized to [0,1) and shifted to [-0.5,0.5) */
    float m;
         if (i == 0)  m = 0.0/64.0;
    else if (i == 1)  m = 32.0/64.0;
    else if (i == 2)  m = 8.0/64.0;
    else if (i == 3)  m = 40.0/64.0;
    else if (i == 4)  m = 2.0/64.0;
    else if (i == 5)  m = 34.0/64.0;
    else if (i == 6)  m = 10.0/64.0;
    else if (i == 7)  m = 42.0/64.0;
    else if (i == 8)  m = 48.0/64.0;
    else if (i == 9)  m = 16.0/64.0;
    else if (i == 10) m = 56.0/64.0;
    else if (i == 11) m = 24.0/64.0;
    else if (i == 12) m = 50.0/64.0;
    else if (i == 13) m = 18.0/64.0;
    else if (i == 14) m = 58.0/64.0;
    else if (i == 15) m = 26.0/64.0;
    else if (i == 16) m = 12.0/64.0;
    else if (i == 17) m = 44.0/64.0;
    else if (i == 18) m = 4.0/64.0;
    else if (i == 19) m = 36.0/64.0;
    else if (i == 20) m = 14.0/64.0;
    else if (i == 21) m = 46.0/64.0;
    else if (i == 22) m = 6.0/64.0;
    else if (i == 23) m = 38.0/64.0;
    else if (i == 24) m = 60.0/64.0;
    else if (i == 25) m = 28.0/64.0;
    else if (i == 26) m = 52.0/64.0;
    else if (i == 27) m = 20.0/64.0;
    else if (i == 28) m = 62.0/64.0;
    else if (i == 29) m = 30.0/64.0;
    else if (i == 30) m = 54.0/64.0;
    else if (i == 31) m = 22.0/64.0;
    else if (i == 32) m = 3.0/64.0;
    else if (i == 33) m = 35.0/64.0;
    else if (i == 34) m = 11.0/64.0;
    else if (i == 35) m = 43.0/64.0;
    else if (i == 36) m = 1.0/64.0;
    else if (i == 37) m = 33.0/64.0;
    else if (i == 38) m = 9.0/64.0;
    else if (i == 39) m = 41.0/64.0;
    else if (i == 40) m = 51.0/64.0;
    else if (i == 41) m = 19.0/64.0;
    else if (i == 42) m = 59.0/64.0;
    else if (i == 43) m = 27.0/64.0;
    else if (i == 44) m = 49.0/64.0;
    else if (i == 45) m = 17.0/64.0;
    else if (i == 46) m = 57.0/64.0;
    else if (i == 47) m = 25.0/64.0;
    else if (i == 48) m = 15.0/64.0;
    else if (i == 49) m = 47.0/64.0;
    else if (i == 50) m = 7.0/64.0;
    else if (i == 51) m = 39.0/64.0;
    else if (i == 52) m = 13.0/64.0;
    else if (i == 53) m = 45.0/64.0;
    else if (i == 54) m = 5.0/64.0;
    else if (i == 55) m = 37.0/64.0;
    else if (i == 56) m = 63.0/64.0;
    else if (i == 57) m = 31.0/64.0;
    else if (i == 58) m = 55.0/64.0;
    else if (i == 59) m = 23.0/64.0;
    else if (i == 60) m = 61.0/64.0;
    else if (i == 61) m = 29.0/64.0;
    else if (i == 62) m = 53.0/64.0;
    else                m = 21.0/64.0;
    return m - 0.5;
  }
  float aastep(float t, float v) {
    float w = fwidth(v) * 0.7;
    return smoothstep(t - w, t + w, v);
  }
  float sdCircle(vec2 p,float r){ return length(p)-r; }
  float sdBox(vec2 p,vec2 b){ vec2 d=abs(p)-b; return length(max(d,0.0))+min(max(d.x,d.y),0.0); }
  float sdRing(vec2 p,float r,float w){ return abs(length(p)-r)-w; }
  float sdRBox(vec2 p,vec2 b,float r){ vec2 d=abs(p)-b+r; return length(max(d,0.0))+min(max(d.x,d.y),0.0)-r; }
  float starShape(vec2 p,float n,float ri,float ro){
    float a = atan(p.y,p.x);
    float r = length(p);
    return r - mix(ri, ro, 0.5 + 0.5 * cos(n*a));
  }
  /* lens (almond) — intersection of two circles offset along x.
     Long axis aligned with Y, perfect for petals. */
  float sdLens(vec2 p, float xOff, float r) {
    return max(length(p - vec2(xOff, 0.0)) - r,
               length(p - vec2(-xOff, 0.0)) - r);
  }
  vec2 rot(vec2 p,float a){ float c=cos(a),s=sin(a); return mat2(c,-s,s,c)*p; }

  vec4 mergeL(vec4 a, vec4 b) {
    return vec4(min(a.x,b.x), min(a.y,b.y), min(a.z,b.z), min(a.w,b.w));
  }

  /* ============================================================
                          CENTER MOTIFS
     Fit within radius ~ 0.20.
     ============================================================ */
  vec4 cEmpty(vec2 p, float v) { return vec4(INF); }

  vec4 cDot(vec2 p, float v) {
    vec4 d = vec4(INF);
    d.x = sdCircle(p, 0.045);
    d.z = sdCircle(p, 0.038);
    return d;
  }

  vec4 cCircle(vec2 p, float v) {
    vec4 d = vec4(INF);
    d.x = abs(sdCircle(p, 0.13)) - 0.011;
    d.z = sdCircle(p, 0.117);
    d.x = min(d.x, abs(sdCircle(p, 0.040)) - 0.005);
    d.x = min(d.x, sdCircle(p, 0.012));
    return d;
  }

  /* STAR — 6/8/12-pt with rotated inner star */
  vec4 cStar(vec2 p, float v) {
    vec4 d = vec4(INF);
    float n = (v < 0.33) ? 6.0 : (v < 0.66 ? 8.0 : 12.0);
    float s1 = starShape(p, n, 0.10, 0.20);
    d.x = abs(s1) - 0.012;
    d.y = s1;
    vec2 pr = rot(p, PI / n);
    float s2 = starShape(pr, n, 0.040, 0.085);
    d.x = min(d.x, abs(s2) - 0.006);
    d.z = s2;
    d.x = min(d.x, sdCircle(p, 0.018));
    return d;
  }

  /* ROSETTE — pointed-petal flower (geometric, mudejar feel) */
  vec4 cRosette(vec2 p, float v) {
    vec4 d = vec4(INF);
    float n = 6.0 + floor(v*3.999)*2.0;          /* 6/8/10/12 */
    float r = length(p);
    float a = atan(p.y,p.x);
    float petR = 0.10 + 0.10*abs(cos(n*0.5*a));
    float petOL = abs(r-petR) - 0.011;
    petOL = max(petOL, r - 0.215);
    petOL = max(petOL, -(r - 0.045));
    d.x = petOL;
    float petF = r - petR;
    petF = max(petF, r - 0.205);
    petF = max(petF, -(r - 0.045));
    d.y = petF;
    d.x = min(d.x, abs(sdCircle(p, 0.045)) - 0.004);
    d.z = sdCircle(p, 0.040);
    d.x = min(d.x, sdCircle(p, 0.014));
    return d;
  }

  /* FLOWER — 8-petal, rounded lens petals (organic, baroque feel) */
  vec4 cFlower(vec2 p, float v) {
    vec4 d = vec4(INF);
    float bestPet = INF;
    /* lens shape proportions vary slightly with v */
    float lr   = 0.108 + 0.020 * v;
    float lOff = 0.092 + 0.018 * v;
    for (int i = 0; i < 8; i++) {
      float a = float(i) * TAU / 8.0;
      vec2 pp = rot(p, -a);
      pp.y -= 0.10;
      float lens = sdLens(pp, lOff, lr);
      bestPet = min(bestPet, lens);
    }
    d.x = abs(bestPet) - 0.011;
    d.y = bestPet;

    /* inner detail ring */
    d.x = min(d.x, abs(sdCircle(p, 0.045)) - 0.005);

    /* center pistil */
    d.z = sdCircle(p, 0.038);
    d.x = min(d.x, sdCircle(p, 0.012));

    /* small stamens between petals */
    for (int i = 0; i < 8; i++) {
      float a = (float(i) + 0.5) * TAU / 8.0;
      vec2 cp = p - 0.073 * vec2(cos(a), sin(a));
      d.w = min(d.w, sdCircle(cp, 0.008));
    }
    return d;
  }

  /* PETAL-4 — four lens petals on cardinal axes with diagonal accents */
  vec4 cPetal4(vec2 p, float v) {
    vec4 d = vec4(INF);
    float bestPet = INF;
    for (int i = 0; i < 4; i++) {
      float a = float(i) * PI * 0.5;
      vec2 pp = rot(p, -a);
      pp.y -= 0.10;
      float lens = sdLens(pp, 0.075, 0.130);
      bestPet = min(bestPet, lens);
    }
    d.x = abs(bestPet) - 0.012;
    d.y = bestPet;

    /* diagonal accents — small filled dots between petals */
    for (int i = 0; i < 4; i++) {
      float a = float(i) * PI * 0.5 + PI * 0.25;
      vec2 cp = p - 0.072 * vec2(cos(a), sin(a));
      d.w = min(d.w, sdCircle(cp, 0.014));
    }

    /* center */
    d.x = min(d.x, abs(sdCircle(p, 0.030)) - 0.004);
    d.x = min(d.x, sdCircle(p, 0.011));
    return d;
  }

  /* INTERLACE — Moorish strapwork, two squares forming an 8-pt knot */
  vec4 cInterlace(vec2 p, float v) {
    vec4 d = vec4(INF);
    float sz = 0.155 + 0.020 * v;
    float s1 = sdBox(p, vec2(sz));
    float s2 = sdBox(rot(p, PI*0.25), vec2(sz));
    d.x = abs(s1) - 0.011;
    d.x = min(d.x, abs(s2) - 0.011);
    /* the union forms the 8-pt star fill */
    d.y = min(s1, s2);
    /* central medallion */
    d.x = min(d.x, abs(sdCircle(p, 0.050)) - 0.005);
    d.z = sdCircle(p, 0.045);
    d.x = min(d.x, sdCircle(p, 0.014));
    return d;
  }

  vec4 cCross(vec2 p, float v) {
    vec4 d = vec4(INF);
    float armW = 0.038 + 0.012 * v;
    float armL = 0.18;
    float a1 = sdRBox(p, vec2(armW, armL), 0.025);
    float a2 = sdRBox(p, vec2(armL, armW), 0.025);
    float cr = min(a1, a2);
    d.x = abs(cr) - 0.011;
    d.y = cr;
    d.x = min(d.x, abs(sdCircle(p, 0.058)) - 0.006);
    d.z = sdCircle(p, 0.052);
    d.x = min(d.x, sdCircle(p, 0.014));
    return d;
  }

  vec4 cQuatre(vec2 p, float v) {
    vec4 d = vec4(INF);
    float ol = INF, fl = INF;
    for (int i = 0; i < 4; i++) {
      float ang = float(i)*PI*0.5 + PI*0.25;
      vec2 cp = p - 0.10 * vec2(cos(ang), sin(ang));
      float c = sdCircle(cp, 0.110);
      ol = min(ol, abs(c) - 0.010);
      fl = min(fl, c);
    }
    d.x = ol; d.y = fl;
    d.x = min(d.x, abs(sdCircle(p, 0.040)) - 0.005);
    d.z = sdCircle(p, 0.034);
    return d;
  }

  vec4 cLozenge(vec2 p, float v) {
    vec4 d = vec4(INF);
    vec2 rp = rot(p, PI*0.25);
    float od = sdBox(rp, vec2(0.135));
    d.x = abs(od) - 0.011;
    d.y = od;
    float id = sdBox(rp, vec2(0.075));
    d.x = min(d.x, abs(id) - 0.006);
    d.z = id;
    if (v > 0.5) {
      d.x = min(d.x, sdCircle(p, 0.020));
    } else {
      float st = starShape(p, 4.0, 0.020, 0.045);
      d.x = min(d.x, abs(st) - 0.005);
    }
    return d;
  }

  vec4 cPinwheel(vec2 p, float v) {
    vec4 d = vec4(INF);
    float curve = 0.05 + 0.05 * v;
    float ol = INF, fl = INF;
    for (int i = 0; i < 4; i++) {
      float a = float(i) * PI * 0.5;
      vec2 rp = rot(p, a);
      float c1 = sdCircle(rp - vec2(0.11, 0.00), 0.13);
      float c2 = sdCircle(rp - vec2(0.11 - curve, 0.10), 0.115);
      float blade = max(c1, -c2);
      blade = max(blade, length(rp) - 0.21);
      blade = max(blade, -(length(rp) - 0.040));
      ol = min(ol, abs(blade) - 0.009);
      fl = min(fl, blade);
    }
    d.x = ol; d.y = fl;
    d.x = min(d.x, abs(sdCircle(p, 0.040)) - 0.005);
    d.z = sdCircle(p, 0.034);
    return d;
  }

  vec4 cSun(vec2 p, float v) {
    vec4 d = vec4(INF);
    float n = 12.0 + floor(v*1.999)*4.0;        /* 12 or 16 */
    float s = starShape(p, n, 0.085, 0.17);
    d.x = abs(s) - 0.007;
    d.x = min(d.x, abs(sdCircle(p, 0.072)) - 0.007);
    d.z = sdCircle(p, 0.064);
    d.x = min(d.x, sdCircle(p, 0.020));
    return d;
  }

  /* TULIP — four tulips radiating outward (Iznik signature).
     Each lobe is an ellipse with a V-cleft apex and two side curls
     at the base — the iconic Ottoman tulip silhouette. */
  vec4 cTulip(vec2 p, float v) {
    vec4 d = vec4(INF);
    float bestFill = INF, bestInner = INF;
    float bulbR = 0.052 + 0.012 * v;
    for (int i = 0; i < 4; i++) {
      float a = float(i) * PI * 0.5;
      vec2 pp = rot(p, -a);
      /* main bulb — vertical ellipse positioned along +y of local frame */
      vec2 q = vec2(pp.x, pp.y - 0.115);
      float ell = length(vec2(q.x * 1.40, q.y * 0.88)) - bulbR;
      /* V-cleft cut into apex (top of tulip) */
      float yLine = 0.165 - 1.45 * abs(pp.x);
      float removeRegion = max(pp.y - yLine, abs(pp.x) - 0.042);
      ell = max(ell, -removeRegion);
      /* side curls at the base — small ovals leaning outward */
      vec2 cu = vec2(abs(pp.x) - 0.052, pp.y - 0.072);
      float curl = length(vec2(cu.x * 1.25, cu.y * 0.95)) - 0.022;
      float petal = min(ell, curl);
      bestFill = min(bestFill, petal);
      /* inner highlight inside bulb (small almond) */
      vec2 inP = vec2(pp.x, pp.y - 0.118);
      float inner = length(vec2(inP.x * 1.7, inP.y * 1.05)) - 0.026;
      inner = max(inner, -removeRegion);
      bestInner = min(bestInner, inner);
    }
    d.x = abs(bestFill) - 0.011;
    d.y = bestFill;
    d.z = bestInner;
    d.x = min(d.x, abs(bestInner) - 0.004);
    /* center medallion */
    d.x = min(d.x, abs(sdCircle(p, 0.038)) - 0.005);
    d.x = min(d.x, sdCircle(p, 0.014));
    return d;
  }

  /* Octagram — 8-point star, the classic Sevillian / Moorish geometric center.
     Built from two overlapping squares rotated 45° apart. */
  vec4 cOctagram(vec2 p, float v) {
    vec4 d = vec4(INF);
    float r1 = 0.18 + 0.020 * v;
    /* axis-aligned square */
    float sq1 = sdBox(p, vec2(r1));
    /* diagonal square — rotated 45° */
    vec2 rp = rot(p, PI*0.25);
    float sq2 = sdBox(rp, vec2(r1));
    /* union = star shape */
    float star = min(sq1, sq2);
    d.x = abs(star) - 0.012;
    d.y = star;
    /* inner medallion */
    d.x = min(d.x, abs(sdCircle(p, 0.062)) - 0.005);
    d.z = sdCircle(p, 0.057);
    /* center pip */
    d.x = min(d.x, sdCircle(p, 0.012));
    return d;
  }

  /* Hexagram — 6-point Star of David. */
  vec4 cHexagram(vec2 p, float v) {
    vec4 d = vec4(INF);
    float ri = 0.080 + 0.010 * v;
    float ro = 0.180 + 0.020 * v;
    float star = starShape(p, 6.0, ri, ro);
    d.x = abs(star) - 0.010;
    d.y = star;
    /* inner ring */
    d.x = min(d.x, abs(sdCircle(p, 0.044)) - 0.004);
    d.z = sdCircle(p, 0.040);
    /* center pip */
    d.x = min(d.x, sdCircle(p, 0.011));
    return d;
  }

  /* Carnation — 4 frilled flowers radiating outward (Iznik signature),
     more rococo than tulip with multiple ruffled lobes at the apex. */
  vec4 cCarnation(vec2 p, float v) {
    vec4 d = vec4(INF);
    float bestFill = INF, bestInner = INF;
    for (int k = 0; k < 4; k++) {
      float a = float(k) * PI * 0.5;
      vec2 pp = rot(p, a);
      /* main bulb — wider than tulip, flatter top */
      vec2 bp = vec2(pp.x, pp.y - 0.110);
      float bulb = length(vec2(bp.x * 1.30, bp.y * 0.95)) - 0.058;
      /* three frilled lobes at top — overlapping bumps */
      float frill = INF;
      for (int j = -1; j <= 1; j++) {
        vec2 fp = vec2(pp.x - float(j) * 0.026, pp.y - 0.155);
        float f = length(fp * vec2(1.0, 1.6)) - 0.024;
        frill = min(frill, f);
      }
      bulb = min(bulb, frill);
      /* notched cleft at apex */
      float cleft = max(pp.y - 0.180 + 0.6*abs(pp.x), abs(pp.x) - 0.025);
      bulb = max(bulb, -cleft);
      bestFill = min(bestFill, bulb);
      /* inner highlight */
      vec2 inP = vec2(pp.x, pp.y - 0.110);
      float inner = length(vec2(inP.x * 1.5, inP.y * 1.10)) - 0.030;
      bestInner = min(bestInner, inner);
    }
    d.x = abs(bestFill) - 0.011;
    d.y = bestFill;
    d.z = bestInner;
    d.x = min(d.x, abs(bestInner) - 0.004);
    /* center medallion */
    d.x = min(d.x, abs(sdCircle(p, 0.040)) - 0.005);
    d.x = min(d.x, sdCircle(p, 0.014));
    return d;
  }

  /* Sunburst — many thin radiating rays from a central disc, denser than cSun. */
  vec4 cSunburst(vec2 p, float v) {
    vec4 d = vec4(INF);
    float r = length(p);
    float a = atan(p.y, p.x);
    /* 16 thin rays */
    float rays = cos(a * 16.0) * 0.5 + 0.5;
    rays = pow(rays, 4.0);
    /* ring of rays from r=0.07 to r=0.24, modulated by ray amplitude */
    float rayLine = abs(r - mix(0.07, 0.24, rays)) - 0.005;
    /* mask to ring band */
    rayLine = max(rayLine, 0.07 - r);
    rayLine = max(rayLine, r - 0.24);
    d.x = rayLine;
    d.y = -rayLine - 0.001;
    /* central disc */
    d.x = min(d.x, abs(sdCircle(p, 0.052)) - 0.006);
    d.z = sdCircle(p, 0.046);
    /* center pip */
    d.x = min(d.x, sdCircle(p, 0.010));
    return d;
  }

  /* Knotwork — Celtic-style interlace, two overlapping ovals at 45° each. */
  vec4 cKnot(vec2 p, float v) {
    vec4 d = vec4(INF);
    float bestOut = INF, bestFill = INF;
    /* 4 overlapping ovals, each 45° apart */
    for (int k = 0; k < 4; k++) {
      float a = float(k) * PI * 0.25;
      vec2 pp = rot(p, a);
      /* tall thin oval through center */
      float oval = length(vec2(pp.x * 2.6, pp.y * 0.95)) - 0.20;
      bestOut = min(bestOut, abs(oval) - 0.0085);
      bestFill = min(bestFill, oval);
    }
    d.x = bestOut;
    d.z = bestFill + 0.020;
    /* center disc */
    d.x = min(d.x, abs(sdCircle(p, 0.034)) - 0.005);
    d.y = sdCircle(p, 0.030);
    return d;
  }

  vec4 dispCenter(float idx, vec2 p, float v) {
    if (idx < 0.5)  return cEmpty(p, v);
    if (idx < 1.5)  return cDot(p, v);
    if (idx < 2.5)  return cCircle(p, v);
    if (idx < 3.5)  return cStar(p, v);
    if (idx < 4.5)  return cRosette(p, v);
    if (idx < 5.5)  return cFlower(p, v);
    if (idx < 6.5)  return cPetal4(p, v);
    if (idx < 7.5)  return cInterlace(p, v);
    if (idx < 8.5)  return cCross(p, v);
    if (idx < 9.5)  return cQuatre(p, v);
    if (idx < 10.5) return cLozenge(p, v);
    if (idx < 11.5) return cPinwheel(p, v);
    if (idx < 12.5) return cSun(p, v);
    if (idx < 13.5) return cTulip(p, v);
    if (idx < 14.5) return cOctagram(p, v);
    if (idx < 15.5) return cHexagram(p, v);
    if (idx < 16.5) return cCarnation(p, v);
    if (idx < 17.5) return cSunburst(p, v);
    return cKnot(p, v);
  }

  /* ============================================================
                            WRAPPERS
     Drawn at radius ~ 0.27 - 0.32.
     ============================================================ */
  vec4 wNone(vec2 p, float v) { return vec4(INF); }

  vec4 wRing(vec2 p, float v) {
    vec4 d = vec4(INF);
    float r1 = 0.27 + 0.03 * v;
    if (v < 0.5) {
      d.x = sdRing(p, r1, 0.005);
    } else {
      d.x = sdRing(p, r1, 0.005);
      d.x = min(d.x, sdRing(p, r1 - 0.020, 0.003));
    }
    return d;
  }

  vec4 wPetalRing(vec2 p, float v) {
    vec4 d = vec4(INF);
    float n = (v < 0.5) ? 8.0 : 12.0;
    d.x = sdRing(p, 0.295, 0.005);
    float a = atan(p.y, p.x);
    float seg = TAU / n;
    float idx = floor((a + PI) / seg);
    float ca = -PI + (idx + 0.5) * seg;
    vec2 cp = p - 0.295 * vec2(cos(ca), sin(ca));
    d.w = sdCircle(cp, 0.020);
    return d;
  }

  vec4 wSqFrame(vec2 p, float v) {
    vec4 d = vec4(INF);
    vec2 rp = (v < 0.5) ? p : rot(p, PI * 0.25);
    d.x = abs(sdBox(rp, vec2(0.27))) - 0.008;
    return d;
  }

  vec4 wOctagon(vec2 p, float v) {
    vec4 d = vec4(INF);
    float s1 = sdBox(p, vec2(0.275));
    float s2 = sdBox(rot(p, PI * 0.25), vec2(0.275));
    float oct = max(s1, s2);
    d.x = abs(oct) - 0.008;
    return d;
  }

  vec4 wBeadRing(vec2 p, float v) {
    vec4 d = vec4(INF);
    float n = 16.0;
    float a = atan(p.y, p.x);
    float seg = TAU / n;
    float idx = floor((a + PI) / seg);
    float ca = -PI + (idx + 0.5) * seg;
    vec2 cp = p - 0.305 * vec2(cos(ca), sin(ca));
    d.w = sdCircle(cp, 0.012);
    return d;
  }

  /* SCALLOP — wavy ring (Baroque convention) */
  vec4 wScallop(vec2 p, float v) {
    vec4 d = vec4(INF);
    float n = (v < 0.5) ? 12.0 : 16.0;
    float r = length(p);
    float a = atan(p.y, p.x);
    float scR = mix(0.270, 0.305, 0.5 + 0.5 * cos(n * a));
    d.x = abs(r - scR) - 0.005;
    return d;
  }

  /* HEXAGON — six-sided polygon outline */
  vec4 wHexagon(vec2 p, float v) {
    vec4 d = vec4(INF);
    float r = 0.290 + 0.020 * v;
    /* hexagon SDF: max over 6 half-planes */
    float hex = -INF;
    /* unrolled — GLSL ES doesn't allow non-const trig in loop indices safely */
    hex = max(hex, dot(p, vec2( 1.0, 0.0)) - r);
    hex = max(hex, dot(p, vec2( 0.5,  0.866)) - r);
    hex = max(hex, dot(p, vec2(-0.5,  0.866)) - r);
    hex = max(hex, dot(p, vec2(-1.0, 0.0)) - r);
    hex = max(hex, dot(p, vec2(-0.5, -0.866)) - r);
    hex = max(hex, dot(p, vec2( 0.5, -0.866)) - r);
    d.x = abs(hex) - 0.006;
    return d;
  }

  /* SAWTOOTH — ring with triangular bumps pointing outward */
  vec4 wSawtooth(vec2 p, float v) {
    vec4 d = vec4(INF);
    float r = length(p);
    float a = atan(p.y, p.x);
    float n = (v < 0.5) ? 24.0 : 32.0;
    /* sawtooth wave on radius — abs of fract gives triangle pattern */
    float teeth = 1.0 - abs(fract(a * n / TAU + 0.5) * 2.0 - 1.0);
    float toothR = mix(0.272, 0.302, teeth);
    d.x = abs(r - toothR) - 0.0045;
    /* baseline ring inside */
    d.x = min(d.x, abs(r - 0.262) - 0.003);
    return d;
  }

  /* TWIST ROPE — two interleaved rings, creates a rope/braid effect */
  vec4 wTwistRope(vec2 p, float v) {
    vec4 d = vec4(INF);
    float r = length(p);
    float a = atan(p.y, p.x);
    float n = 16.0;
    /* two sine waves, 180° apart */
    float r1 = 0.286 + 0.012 * sin(n * a);
    float r2 = 0.286 + 0.012 * sin(n * a + PI);
    d.x = min(abs(r - r1) - 0.0045, abs(r - r2) - 0.0045);
    return d;
  }

  vec4 dispWrapper(float idx, vec2 p, float v) {
    if (idx < 0.5) return wNone(p, v);
    if (idx < 1.5) return wRing(p, v);
    if (idx < 2.5) return wPetalRing(p, v);
    if (idx < 3.5) return wSqFrame(p, v);
    if (idx < 4.5) return wOctagon(p, v);
    if (idx < 5.5) return wBeadRing(p, v);
    if (idx < 6.5) return wScallop(p, v);
    if (idx < 7.5) return wHexagon(p, v);
    if (idx < 8.5) return wSawtooth(p, v);
    return wTwistRope(p, v);
  }

  /* ============================================================
                            CORNERS
     Folded via abs(p) so 4 corners are drawn at once.
     Quarter-tile motifs (qRose, qStar, qMedal) imply continuity:
     when 4 tiles meet at a corner, the partial motifs combine.
     ============================================================ */
  vec4 coNone(vec2 p, float v) { return vec4(INF); }

  /* Quarter rosette — wavy ring at corner */
  vec4 coQRose(vec2 p, float v) {
    vec4 d = vec4(INF);
    vec2 ap = abs(p);
    vec2 cp = ap - 0.5;
    float r = length(cp);
    /* angle measured inward from corner */
    float a = atan(-cp.y, -cp.x);                /* 0 .. PI/2 */
    float petR = mix(0.11, 0.16, 0.5 + 0.5 * cos(8.0 * a));
    float pet = abs(r - petR) - 0.009;
    pet = max(pet, r - 0.20);
    pet = max(pet, -(r - 0.06));
    d.x = pet;
    d.x = min(d.x, sdCircle(cp, 0.014));
    return d;
  }

  /* Quarter 8-pt star at corner — completes to full star across 4 tiles */
  vec4 coQStar(vec2 p, float v) {
    vec4 d = vec4(INF);
    vec2 ap = abs(p);
    vec2 cp = ap - 0.5;
    float r = length(cp);
    float a = atan(-cp.y, -cp.x);
    float starR = mix(0.060, 0.135, 0.5 + 0.5 * cos(8.0 * a));
    float star = r - starR;
    d.x = abs(star) - 0.009;
    d.y = star;
    return d;
  }

  /* Quarter medallion — concentric arcs at corner */
  vec4 coQMedal(vec2 p, float v) {
    vec4 d = vec4(INF);
    vec2 ap = abs(p);
    vec2 cp = ap - 0.5;
    float r = length(cp);
    /* outer thicker arc */
    d.x = abs(r - 0.13) - 0.012;
    /* inner thinner arc */
    d.x = min(d.x, abs(r - 0.060) - 0.005);
    d.y = r - 0.055;
    /* tiny dot at the apex */
    d.x = min(d.x, sdCircle(cp, 0.012));
    return d;
  }

  /* Leaf — small lens leaf in each corner */
  vec4 coLeaf(vec2 p, float v) {
    vec4 d = vec4(INF);
    vec2 ap = abs(p);
    vec2 cp = ap - vec2(0.36);
    vec2 rp = rot(cp, PI*0.25);
    float leaf = sdLens(rp, 0.030, 0.060);
    d.x = abs(leaf) - 0.006;
    d.y = leaf;
    /* center vein */
    float vein = abs(rp.x) - 0.001;
    vein = max(vein, abs(rp.y) - 0.040);
    d.x = min(d.x, vein - 0.002);
    return d;
  }

  /* Acanthus — curling leaf with vein, classical Mediterranean motif */
  vec4 coAcanthus(vec2 p, float v) {
    vec4 d = vec4(INF);
    vec2 ap = abs(p);
    vec2 cp = ap - vec2(0.36);
    vec2 rp = rot(cp, PI*0.25);
    float leaf = sdLens(rp, 0.060, 0.082);
    d.x = abs(leaf) - 0.008;
    d.y = leaf;
    /* central vein */
    float vein = abs(rp.x) - 0.001;
    vein = max(vein, abs(rp.y) - 0.046);
    d.x = min(d.x, vein - 0.0025);
    /* base dot */
    vec2 bp = rot(cp + vec2(0.030, 0.030), PI*0.25);
    d.x = min(d.x, sdCircle(bp, 0.008));
    return d;
  }

  /* Cluster — 3-dot triangle */
  vec4 coCluster(vec2 p, float v) {
    vec4 d = vec4(INF);
    vec2 ap = abs(p);
    vec2 c1 = ap - vec2(0.41, 0.41);
    vec2 c2 = ap - vec2(0.36, 0.42);
    vec2 c3 = ap - vec2(0.42, 0.36);
    d.w = sdCircle(c1, 0.014);
    d.w = min(d.w, sdCircle(c2, 0.011));
    d.w = min(d.w, sdCircle(c3, 0.011));
    return d;
  }

  /* Floral — small 4-petal flower in each corner */
  vec4 coFloral(vec2 p, float v) {
    vec4 d = vec4(INF);
    vec2 ap = abs(p);
    vec2 cp = ap - vec2(0.40);
    float r = length(cp);
    float a = atan(cp.y, cp.x);
    float petR = 0.025 + 0.020 * abs(cos(2.0*a + PI*0.25));
    d.x = abs(r - petR) - 0.004;
    d.x = min(d.x, sdCircle(cp, 0.008));
    return d;
  }

  /* Fan — palmette spread in each corner, classical Roman/Greek motif */
  vec4 coFan(vec2 p, float v) {
    vec4 d = vec4(INF);
    vec2 ap = abs(p);
    vec2 cp = ap - vec2(0.41);
    /* rotate so fan opens outward toward corner */
    vec2 rp = rot(cp, -PI*0.25);
    float r = length(rp);
    float a = atan(rp.y, rp.x);
    /* fan rays — 5 rays in a 90° spread */
    float rayA = abs(a + PI*0.5);  /* shift so fan center is at angle 0 */
    /* keep only rays within ±0.4 rad */
    float mask = smoothstep(0.45, 0.40, rayA);
    /* periodic ray pattern */
    float ray = abs(sin(rayA * 6.0));
    float rayLine = abs(r - 0.040) - 0.003 - ray * 0.012;
    rayLine = max(rayLine, rayA - 0.45);
    rayLine = max(rayLine, 0.012 - r);
    d.x = rayLine;
    /* base arc */
    d.x = min(d.x, abs(r - 0.052) - 0.0035);
    return d;
  }

  /* Tendril — curling stem with bud at the end */
  vec4 coTendril(vec2 p, float v) {
    vec4 d = vec4(INF);
    vec2 ap = abs(p);
    vec2 cp = ap - vec2(0.42);
    /* parametric curl: small arc */
    float r = length(cp);
    float a = atan(cp.y, cp.x);
    /* arc segment from angle PI to PI*0.5 (curling inward) */
    float curlR = 0.038;
    float curl = abs(r - curlR) - 0.0035;
    /* mask to a quarter arc */
    float aMod = a + PI*0.75;  /* shift center of arc */
    curl = max(curl, abs(aMod) - PI*0.45);
    d.x = curl;
    /* small bud at tip — at angle 0 from cp */
    vec2 bud = cp - vec2(curlR, 0.0);
    d.x = min(d.x, sdCircle(bud, 0.011));
    /* base dot at angle PI*1.5 */
    vec2 base = cp - vec2(0.0, -curlR);
    d.x = min(d.x, sdCircle(base, 0.007));
    return d;
  }

  /* Tassel — three teardrop hangs from a corner anchor point */
  vec4 coTassel(vec2 p, float v) {
    vec4 d = vec4(INF);
    vec2 ap = abs(p);
    /* anchor near the corner, drops hanging inward toward center */
    vec2 anchor = vec2(0.435);
    vec2 cp = ap - anchor;
    /* three teardrops radiating along diagonal toward center */
    float bestD = INF;
    /* each drop is a small ellipse at offset along inward diagonal */
    for (int k = 0; k < 3; k++) {
      float t = 0.025 + float(k) * 0.024;
      float spread = (float(k) - 1.0) * 0.022;
      /* drop center: along inward diagonal (-1,-1)/sqrt(2), with side spread */
      vec2 drop = cp - vec2(-t * 0.7071 + spread * 0.7071,
                            -t * 0.7071 - spread * 0.7071);
      float dr = length(drop * vec2(1.0, 1.4)) - 0.013;
      bestD = min(bestD, dr);
    }
    d.w = bestD;
    /* anchor dot */
    d.x = sdCircle(cp, 0.009);
    return d;
  }

  /* Scroll — volute spiral curl in each corner */
  vec4 coScroll(vec2 p, float v) {
    vec4 d = vec4(INF);
    vec2 ap = abs(p);
    vec2 cp = ap - vec2(0.40);
    /* outer ring */
    float r = length(cp);
    d.x = abs(r - 0.038) - 0.0045;
    /* inner small ring (eye of the scroll) */
    d.x = min(d.x, abs(r - 0.014) - 0.0025);
    /* small bridge connecting outer to inner — a thin line at angle PI*0.75 */
    vec2 br = rot(cp, -PI*0.75);
    float bridge = max(abs(br.y) - 0.0020, br.x - 0.040);
    bridge = max(bridge, -br.x - 0.005);
    d.x = min(d.x, bridge);
    return d;
  }

  vec4 dispCorners(float idx, vec2 p, float v) {
    if (idx < 0.5)  return coNone(p, v);
    if (idx < 1.5)  return coQRose(p, v);
    if (idx < 2.5)  return coQStar(p, v);
    if (idx < 3.5)  return coQMedal(p, v);
    if (idx < 4.5)  return coLeaf(p, v);
    if (idx < 5.5)  return coAcanthus(p, v);
    if (idx < 6.5)  return coCluster(p, v);
    if (idx < 7.5)  return coFloral(p, v);
    if (idx < 8.5)  return coFan(p, v);
    if (idx < 9.5)  return coTendril(p, v);
    if (idx < 10.5) return coTassel(p, v);
    return coScroll(p, v);
  }

  /* ============================================================
                          FIELD ACCENTS
     ============================================================ */
  vec4 fNone(vec2 p, float v) { return vec4(INF); }

  vec4 fDots4(vec2 p, float v) {
    vec4 d = vec4(INF);
    float r = 0.38;
    float dd = INF;
    dd = min(dd, sdCircle(p - vec2(r, 0.0), 0.018));
    dd = min(dd, sdCircle(p - vec2(-r, 0.0), 0.018));
    dd = min(dd, sdCircle(p - vec2(0.0, r), 0.018));
    dd = min(dd, sdCircle(p - vec2(0.0, -r), 0.018));
    d.w = dd;
    return d;
  }

  vec4 fDots4d(vec2 p, float v) {
    vec4 d = vec4(INF);
    vec2 ap = abs(p);
    d.w = sdCircle(ap - vec2(0.27), 0.018);
    return d;
  }

  vec4 fCrosses(vec2 p, float v) {
    vec4 d = vec4(INF);
    float dd = INF;
    for (int i = 0; i < 4; i++) {
      float a = float(i) * PI * 0.5;
      vec2 cp = p - 0.36 * vec2(cos(a), sin(a));
      float c1 = sdRBox(cp, vec2(0.020, 0.005), 0.002);
      float c2 = sdRBox(cp, vec2(0.005, 0.020), 0.002);
      dd = min(dd, min(c1, c2));
    }
    d.x = dd;
    return d;
  }

  vec4 fBeads(vec2 p, float v) {
    vec4 d = vec4(INF);
    float n = 8.0;
    float a = atan(p.y, p.x);
    float seg = TAU / n;
    float idx = floor((a + PI) / seg);
    float ca = -PI + (idx + 0.5) * seg;
    vec2 cp = p - 0.36 * vec2(cos(ca), sin(ca));
    d.w = sdCircle(cp, 0.012);
    return d;
  }

  /* fDots8 — 8 dots, cardinals + diagonals */
  vec4 fDots8(vec2 p, float v) {
    vec4 d = vec4(INF);
    float r = 0.36;
    float dd = INF;
    /* cardinals */
    dd = min(dd, sdCircle(p - vec2( r, 0.0), 0.014));
    dd = min(dd, sdCircle(p - vec2(-r, 0.0), 0.014));
    dd = min(dd, sdCircle(p - vec2(0.0,  r), 0.014));
    dd = min(dd, sdCircle(p - vec2(0.0, -r), 0.014));
    /* diagonals (slightly farther out) */
    float rd = 0.30;
    dd = min(dd, sdCircle(p - vec2( rd,  rd), 0.011));
    dd = min(dd, sdCircle(p - vec2(-rd,  rd), 0.011));
    dd = min(dd, sdCircle(p - vec2( rd, -rd), 0.011));
    dd = min(dd, sdCircle(p - vec2(-rd, -rd), 0.011));
    d.w = dd;
    return d;
  }

  /* fStars — small 4-point stars on the diagonals */
  vec4 fStars(vec2 p, float v) {
    vec4 d = vec4(INF);
    float r = 0.30;
    float ss = INF;
    vec2 q;
    q = p - vec2( r,  r); ss = min(ss, starShape(q, 4.0, 0.012, 0.026));
    q = p - vec2(-r,  r); ss = min(ss, starShape(q, 4.0, 0.012, 0.026));
    q = p - vec2( r, -r); ss = min(ss, starShape(q, 4.0, 0.012, 0.026));
    q = p - vec2(-r, -r); ss = min(ss, starShape(q, 4.0, 0.012, 0.026));
    d.x = abs(ss) - 0.0035;
    d.y = ss;
    return d;
  }

  vec4 dispField(float idx, vec2 p, float v) {
    if (idx < 0.5) return fNone(p, v);
    if (idx < 1.5) return fDots4(p, v);
    if (idx < 2.5) return fDots4d(p, v);
    if (idx < 3.5) return fCrosses(p, v);
    if (idx < 4.5) return fBeads(p, v);
    if (idx < 5.5) return fDots8(p, v);
    return fStars(p, v);
  }

  /* ============================================================
                       EDGE MIDPOINT MOTIFS
     The other half of "tapete" thinking — quarter-corners imply
     what happens when 4 tiles meet at intersections; edge motifs
     are *halved* at the midpoint of each edge so they complete
     with the neighbor tile across the seam.
     ============================================================ */
  vec4 eDot(vec2 ep, float v) {
    vec4 d = vec4(INF);
    d.w = sdCircle(ep - vec2(0.0, 0.060), 0.020);
    return d;
  }

  vec4 eDots3(vec2 ep, float v) {
    vec4 d = vec4(INF);
    vec2 sp = vec2(abs(ep.x), ep.y);
    d.w = sdCircle(sp - vec2(0.0, 0.060), 0.014);
    d.w = min(d.w, sdCircle(sp - vec2(0.045, 0.060), 0.010));
    return d;
  }

  vec4 eDiamond(vec2 ep, float v) {
    vec4 d = vec4(INF);
    vec2 cp = vec2(ep.x, ep.y - 0.060);
    vec2 rp = rot(cp, PI*0.25);
    float dia = sdBox(rp, vec2(0.030));
    d.x = abs(dia) - 0.005;
    d.y = dia;
    return d;
  }

  /* Half-flower fanning inward — completes with neighbor tile across the seam */
  vec4 eHalfRose(vec2 ep, float v) {
    vec4 d = vec4(INF);
    vec2 sp = vec2(abs(ep.x), ep.y);
    /* center petal */
    vec2 p1 = vec2(sp.x, sp.y - 0.075);
    float lens1 = sdLens(p1, 0.038, 0.072);
    /* side petal */
    vec2 p2 = sp - vec2(0.052, 0.045);
    vec2 rp2 = rot(p2, PI*0.30);
    float lens2 = sdLens(rp2, 0.025, 0.050);
    float petals = min(lens1, lens2);
    d.x = abs(petals) - 0.007;
    d.y = petals;
    /* pistil */
    d.x = min(d.x, sdCircle(vec2(sp.x, sp.y - 0.075), 0.010));
    return d;
  }

  /* Concentric arcs bulging inward (medallion-half) */
  vec4 eAcorn(vec2 ep, float v) {
    vec4 d = vec4(INF);
    vec2 cp = ep - vec2(0.0, 0.060);
    float arc = length(cp) - 0.045;
    d.x = abs(arc) - 0.006;
    d.x = min(d.x, abs(length(cp) - 0.020) - 0.004);
    d.z = length(cp) - 0.018;
    return d;
  }

  /* eStar — small 4-point star at edge midpoint */
  vec4 eStar(vec2 ep, float v) {
    vec4 d = vec4(INF);
    vec2 cp = ep - vec2(0.0, 0.058);
    float st = starShape(cp, 4.0, 0.014, 0.030);
    d.x = abs(st) - 0.0035;
    d.y = st;
    return d;
  }

  /* eChev — chevron point pushed inward from edge */
  vec4 eChev(vec2 ep, float v) {
    vec4 d = vec4(INF);
    vec2 cp = ep - vec2(0.0, 0.050);
    /* triangle with apex at cp = (0,0) pointing toward center */
    float lo = abs(cp.x) - cp.y * 1.2;     /* slope of side */
    float hi = -cp.y - 0.034;              /* base at y = -0.034 */
    float tri = max(lo, hi);
    d.x = abs(tri) - 0.005;
    d.y = tri;
    return d;
  }

  /* eCrown — fleur-de-lis fragment, 3 small lobes */
  vec4 eCrown(vec2 ep, float v) {
    vec4 d = vec4(INF);
    vec2 cp = ep - vec2(0.0, 0.058);
    /* center vertical lobe */
    float c0 = length(vec2(cp.x * 1.5, cp.y - 0.020) * 1.0) - 0.022;
    /* side lobes */
    float c1 = length(vec2((cp.x - 0.030) * 1.4, cp.y * 1.2)) - 0.018;
    float c2 = length(vec2((cp.x + 0.030) * 1.4, cp.y * 1.2)) - 0.018;
    float lobes = min(c0, min(c1, c2));
    d.x = abs(lobes) - 0.005;
    d.y = lobes;
    /* base bar */
    float bar = max(abs(cp.x) - 0.045, abs(cp.y + 0.012) - 0.0040);
    d.x = min(d.x, bar);
    return d;
  }

  vec4 dispEdges(float idx, vec2 p, float v) {
    if (idx < 0.5) return vec4(INF);
    /* For the nearest edge, build local coords:
       ep.x = position along edge (0 at midpoint, ±0.5 at corner)
       ep.y = depth from edge (0 at edge, increasing inward)        */
    vec2 ap = abs(p);
    vec2 ep = (ap.y > ap.x) ? vec2(p.x, 0.5 - ap.y) : vec2(p.y, 0.5 - ap.x);
    if (idx < 1.5) return eDot(ep, v);
    if (idx < 2.5) return eDots3(ep, v);
    if (idx < 3.5) return eDiamond(ep, v);
    if (idx < 4.5) return eHalfRose(ep, v);
    if (idx < 5.5) return eAcorn(ep, v);
    if (idx < 6.5) return eStar(ep, v);
    if (idx < 7.5) return eChev(ep, v);
    return eCrown(ep, v);
  }

  /* ============================================================
                          STRAP ARMS
     The connective tissue of the tapete tradition: ribbons that
     run from the central motif outward to the corners or edges,
     literally "tying" the composition together.  Without these,
     center and corners feel disconnected; with them, the tile
     becomes a unified whole that flows into its neighbors.
     ============================================================ */
  vec4 stNone(vec2 p) { return vec4(INF); }

  /* Diagonal straps to corners (single filled ribbon each) */
  vec4 stDiag(vec2 p) {
    vec4 d = vec4(INF);
    vec2 ap = abs(p);
    /* perpendicular distance from the diagonal y=x in this quadrant */
    float dist = abs(ap.x - ap.y) * 0.7071;
    float w = 0.014;
    float fill = dist - w;
    float outline = abs(dist - w) - 0.0035;
    /* mask: hide near center (let center motif breathe) and near corner
       (let corner motif breathe) */
    float rad = max(ap.x, ap.y);
    float mask = max(0.085 - rad, rad - 0.420);
    fill = max(fill, mask);
    outline = max(outline, mask);
    d.x = outline;
    d.y = fill;
    return d;
  }

  /* Double-rail diagonal — two thin parallel lines (no fill) */
  vec4 stDiagDouble(vec2 p) {
    vec4 d = vec4(INF);
    vec2 ap = abs(p);
    float dist = abs(ap.x - ap.y) * 0.7071;
    float gap = 0.022;
    /* two parallel lines at perpendicular distance ±gap from centerline.
       Since dist is unsigned, |dist - gap| < t marks both lines. */
    float outline = abs(dist - gap) - 0.0035;
    float rad = max(ap.x, ap.y);
    float mask = max(0.090 - rad, rad - 0.420);
    outline = max(outline, mask);
    d.x = outline;
    return d;
  }

  /* Cardinal straps (toward edge midpoints) — for tiles where the corners
     stay decorative but the cardinal axes carry the connective weight */
  vec4 stCross(vec2 p) {
    vec4 d = vec4(INF);
    vec2 ap = abs(p);
    /* distance from the nearest cardinal axis */
    float dist = min(ap.x, ap.y);
    float w = 0.014;
    float fill = dist - w;
    float outline = abs(dist - w) - 0.0035;
    float rad = max(ap.x, ap.y);
    float mask = max(0.085 - rad, rad - 0.428);
    fill = max(fill, mask);
    outline = max(outline, mask);
    d.x = outline;
    d.y = fill;
    return d;
  }

  /* 8-ray starburst — thin rays along both cardinals and diagonals */
  vec4 stStarBurst(vec2 p) {
    vec4 d = vec4(INF);
    vec2 ap = abs(p);
    float dDiag = abs(ap.x - ap.y) * 0.7071;
    float dCard = min(ap.x, ap.y);
    float dist = min(dDiag, dCard);
    float outline = abs(dist - 0.005) - 0.003;
    float rad = max(ap.x, ap.y);
    float mask = max(0.095 - rad, rad - 0.420);
    outline = max(outline, mask);
    d.x = outline;
    return d;
  }

  /* Curved diagonal arms — sinusoidal arc to each corner */
  vec4 stCurvArm(vec2 p) {
    vec4 d = vec4(INF);
    vec2 ap = abs(p);
    /* parameterize along main diagonal (ap.x + ap.y), perpendicular = (ap.x - ap.y)/√2 */
    float u = (ap.x + ap.y) * 0.7071;       /* 0 at center, ~0.7 at corner */
    float w = (ap.x - ap.y) * 0.7071;       /* perpendicular offset */
    /* gentle wave perpendicular to main diagonal */
    float wave = sin(u * 14.0) * 0.012;
    float dist = abs(w - wave);
    float fill = dist - 0.013;
    float outline = abs(dist - 0.013) - 0.003;
    float rad = max(ap.x, ap.y);
    float mask = max(0.090 - rad, rad - 0.42);
    fill = max(fill, mask);
    outline = max(outline, mask);
    d.x = outline;
    d.y = fill;
    return d;
  }

  /* Knotted arm — diagonal arms with a pearl/knot at midpoint */
  vec4 stKnotArm(vec2 p) {
    vec4 d = vec4(INF);
    vec2 ap = abs(p);
    float dist = abs(ap.x - ap.y) * 0.7071;
    float w = 0.011;
    float fill = dist - w;
    float outline = abs(dist - w) - 0.0030;
    float rad = max(ap.x, ap.y);
    float mask = max(0.085 - rad, rad - 0.42);
    fill = max(fill, mask);
    outline = max(outline, mask);
    d.x = outline;
    d.y = fill;
    /* knot beads at midpoint */
    vec2 midA = vec2(0.225, 0.225);  /* midpoint along NE diagonal */
    vec2 midB = vec2(-0.225, 0.225); /* midpoint along NW diagonal — but we use ap so... */
    /* using ap means single midpoint per quadrant */
    float bead = sdCircle(ap - vec2(0.225, 0.225), 0.020);
    d.x = min(d.x, abs(bead) - 0.0035);
    d.y = min(d.y, bead);
    return d;
  }

  vec4 dispStraps(float idx, vec2 p) {
    if (idx < 0.5) return stNone(p);
    if (idx < 1.5) return stDiag(p);
    if (idx < 2.5) return stDiagDouble(p);
    if (idx < 3.5) return stCross(p);
    if (idx < 4.5) return stStarBurst(p);
    if (idx < 5.5) return stCurvArm(p);
    return stKnotArm(p);
  }

  /* ============================================================
                         GROUND PATTERNS
     The fine repeating texture across the white field.  Real
     azulejos almost always carry one — a sparse hand-painted
     suggestion of texture, not a wallpaper overlay.  Each
     element gets cellular jitter so the pattern feels brushed,
     not printed.  Rendered in the outline color at low alpha
     with edge falloff, so it reads as "the surface is alive".
     Returns a scalar SDF.
     ============================================================ */
  /* tiny per-cell pseudo-random vector for jittering positions */
  vec2 cellJit(vec2 cell, float seed) {
    float a = hash21(cell + seed) * TAU;
    float r = hash21(cell + seed + 13.7);
    return vec2(cos(a), sin(a)) * r;
  }
  /* per-cell scalar for skipping or scale variation */
  float cellHash(vec2 cell, float seed) {
    return hash21(cell + seed);
  }

  /* gDots — irregular dot grid, position-jittered, occasional drops */
  float gDots(vec2 p) {
    float k = 0.052;
    vec2 cell = floor((p + 100.0) / k);
    vec2 c = mod(p + 0.5 * k + 100.0, k) - 0.5 * k;
    /* jitter position within cell */
    c -= cellJit(cell, 1.3) * k * 0.18;
    /* occasional dropped dots */
    if (cellHash(cell, 7.2) > 0.85) return INF;
    float r = 0.0048 + 0.0022 * cellHash(cell, 3.1);
    return length(c) - r;
  }

  /* gFlecks — sparse irregular brush flecks, no grid feel */
  float gFlecks(vec2 p) {
    float k = 0.085;
    vec2 cell = floor((p + 100.0) / k);
    vec2 c = mod(p + 0.5 * k + 100.0, k) - 0.5 * k;
    c -= cellJit(cell, 4.7) * k * 0.42;
    if (cellHash(cell, 9.1) > 0.35) return INF;
    float ang = (cellHash(cell, 2.3) - 0.5) * PI;
    vec2 rp = rot(c, ang);
    return sdBox(rp, vec2(0.0085, 0.0022));
  }

  /* gFlorets — tiny outlined 4-petal florets at sparse grid points */
  float gFlorets(vec2 p) {
    float k = 0.115;
    vec2 cell = floor((p + 100.0) / k);
    vec2 c = mod(p + 0.5 * k + 100.0, k) - 0.5 * k;
    c -= cellJit(cell, 5.9) * k * 0.22;
    if (cellHash(cell, 11.3) > 0.55) return INF;
    float r = length(c);
    float a = atan(c.y, c.x);
    float petR = 0.014 + 0.006 * abs(cos(2.0*a));
    float d = abs(r - petR) - 0.0024;
    d = min(d, length(c) - 0.0022);
    return d;
  }

  /* gWhisks — short diagonal pen strokes, varied direction per cell */
  float gWhisks(vec2 p) {
    float k = 0.062;
    vec2 cell = floor((p + 100.0) / k);
    vec2 c = mod(p + 0.5 * k + 100.0, k) - 0.5 * k;
    c -= cellJit(cell, 6.4) * k * 0.20;
    if (cellHash(cell, 12.7) > 0.55) return INF;
    float dir = step(0.5, cellHash(cell, 8.2));
    float ang = mix(PI*0.25, -PI*0.25, dir);
    vec2 rp = rot(c, ang);
    return sdBox(rp, vec2(0.014, 0.0018));
  }

  /* gQuincunx — staggered jittered dots, slightly denser than gDots */
  float gQuincunx(vec2 p) {
    float kx = 0.060, ky = 0.052;
    vec2 cell = vec2(floor((p.x + 100.0) / kx), floor((p.y + 100.0) / ky));
    float ox = mod(cell.y, 2.0) * 0.5;
    float lx = mod((p.x + 100.0) / kx - ox, 1.0) - 0.5;
    float ly = (p.y + 100.0) / ky - floor((p.y + 100.0) / ky) - 0.5;
    vec2 c = vec2(lx * kx, ly * ky);
    c -= cellJit(cell, 2.8) * vec2(kx, ky) * 0.16;
    if (cellHash(cell, 4.4) > 0.88) return INF;
    return length(c) - 0.0050;
  }

  /* gStars — tiny 4-point stars on a sparse jittered grid */
  float gStars(vec2 p) {
    float k = 0.090;
    vec2 cell = floor((p + 100.0) / k);
    vec2 c = mod(p + 0.5 * k + 100.0, k) - 0.5 * k;
    c -= cellJit(cell, 7.6) * k * 0.22;
    if (cellHash(cell, 14.1) > 0.50) return INF;
    return starShape(c, 4.0, 0.005, 0.012);
  }

  float dispGround(float idx, vec2 p) {
    if (idx < 0.5) return INF;
    if (idx < 1.5) return gDots(p);
    if (idx < 2.5) return gFlecks(p);
    if (idx < 3.5) return gFlorets(p);
    if (idx < 4.5) return gWhisks(p);
    if (idx < 5.5) return gQuincunx(p);
    return gStars(p);
  }

  /* ============================================================
                              FRAMES
     ============================================================ */
  vec4 frNone(vec2 p) { return vec4(INF); }

  vec4 frThin(vec2 p) {
    vec4 d = vec4(INF);
    d.x = abs(sdBox(p, vec2(0.470))) - 0.005;
    return d;
  }

  vec4 frDouble(vec2 p) {
    vec4 d = vec4(INF);
    d.x = abs(sdBox(p, vec2(0.470))) - 0.006;
    d.x = min(d.x, abs(sdBox(p, vec2(0.430))) - 0.004);
    return d;
  }

  vec4 frThick(vec2 p) {
    vec4 d = vec4(INF);
    d.x = abs(sdBox(p, vec2(0.460))) - 0.013;
    return d;
  }

  vec4 frBeaded(vec2 p) {
    vec4 d = vec4(INF);
    vec2 ap = abs(p);
    if (ap.x > 0.42 || ap.y > 0.42) {
      float beadSp = 0.075;
      float bead;
      if (ap.x > ap.y) {
        float yOff = mod(p.y + beadSp*0.5, beadSp) - beadSp*0.5;
        bead = length(vec2(ap.x - 0.460, yOff)) - 0.010;
      } else {
        float xOff = mod(p.x + beadSp*0.5, beadSp) - beadSp*0.5;
        bead = length(vec2(xOff, ap.y - 0.460)) - 0.010;
      }
      d.x = bead;
    }
    return d;
  }

  vec4 frCornerSq(vec2 p) {
    vec4 d = vec4(INF);
    d.x = abs(sdBox(p, vec2(0.470))) - 0.005;
    vec2 ap = abs(p);
    vec2 cp = ap - vec2(0.460);
    d.w = sdBox(cp, vec2(0.038));
    return d;
  }

  /* Decorated frames — "the frame is itself a small composition"
     Each lays a decorative band between two thin rails near the edge. */

  /* CHEVRON — zigzag triangle wave between rails */
  vec4 frChevron(vec2 p) {
    vec4 d = vec4(INF);
    vec2 ap = abs(p);
    float onE = max(ap.x, ap.y);
    float t   = (ap.x > ap.y) ? p.y : p.x;
    /* outer & inner rails */
    d.x = abs(onE - 0.478) - 0.003;
    d.x = min(d.x, abs(onE - 0.418) - 0.003);
    /* zigzag */
    float period = 0.05;
    float u = mod(t / period + 0.5, 1.0);
    float tri = (u < 0.5) ? u * 2.0 : 2.0 - u * 2.0;
    float h = (tri - 0.5) * 0.030;
    float line = abs(onE - 0.448 - h) - 0.0035;
    line = max(line, 0.420 - onE);
    line = max(line, onE - 0.476);
    d.x = min(d.x, line);
    return d;
  }

  /* ROPE — two anti-phase sine waves, braided */
  vec4 frRope(vec2 p) {
    vec4 d = vec4(INF);
    vec2 ap = abs(p);
    float onE = max(ap.x, ap.y);
    float t   = (ap.x > ap.y) ? p.y : p.x;
    d.x = abs(onE - 0.478) - 0.003;
    d.x = min(d.x, abs(onE - 0.418) - 0.003);
    float period = 0.045;
    float wave = sin(t * TAU / period) * 0.013;
    float line1 = abs(onE - 0.448 - wave) - 0.0035;
    float line2 = abs(onE - 0.448 + wave) - 0.0035;
    line1 = max(line1, 0.420 - onE); line1 = max(line1, onE - 0.476);
    line2 = max(line2, 0.420 - onE); line2 = max(line2, onE - 0.476);
    d.x = min(d.x, min(line1, line2));
    return d;
  }

  /* PEARLS — beaded band between rails (egg-and-dart relative) */
  vec4 frPearls(vec2 p) {
    vec4 d = vec4(INF);
    vec2 ap = abs(p);
    float onE = max(ap.x, ap.y);
    float t   = (ap.x > ap.y) ? p.y : p.x;
    d.x = abs(onE - 0.478) - 0.003;
    d.x = min(d.x, abs(onE - 0.418) - 0.003);
    float period = 0.045;
    float tCell = mod(t + period * 0.5, period) - period * 0.5;
    float pearl = length(vec2(tCell, onE - 0.448)) - 0.011;
    pearl = max(pearl, 0.420 - onE);
    pearl = max(pearl, onE - 0.476);
    d.w = pearl;
    return d;
  }

  /* DENTILS — filled rectangular blocks between rails */
  vec4 frDentils(vec2 p) {
    vec4 d = vec4(INF);
    vec2 ap = abs(p);
    float onE = max(ap.x, ap.y);
    float t   = (ap.x > ap.y) ? p.y : p.x;
    d.x = abs(onE - 0.478) - 0.003;
    d.x = min(d.x, abs(onE - 0.418) - 0.003);
    float period = 0.040;
    float tCell = mod(t + period * 0.5, period) - period * 0.5;
    float block = sdBox(vec2(tCell, onE - 0.448), vec2(period * 0.32, 0.013));
    block = max(block, 0.420 - onE);
    block = max(block, onE - 0.476);
    d.x = min(d.x, abs(block) - 0.0025);
    d.y = block;
    return d;
  }

  /* TRIPLE — three thin parallel rails */
  vec4 frTriple(vec2 p) {
    vec4 d = vec4(INF);
    d.x = abs(sdBox(p, vec2(0.480))) - 0.0025;
    d.x = min(d.x, abs(sdBox(p, vec2(0.460)) ) - 0.0025);
    d.x = min(d.x, abs(sdBox(p, vec2(0.440)) ) - 0.0025);
    return d;
  }

  /* CHAIN — small alternating circles along the frame edge */
  vec4 frChain(vec2 p) {
    vec4 d = vec4(INF);
    vec2 ap = abs(p);
    float onE = max(ap.x, ap.y);
    float t   = (ap.x > ap.y) ? p.y : p.x;
    /* rails */
    d.x = abs(onE - 0.475) - 0.0025;
    /* alternating rings */
    float period = 0.052;
    float tCell = mod(t + period * 0.5, period) - period * 0.5;
    /* ring SDF */
    float ring = abs(length(vec2(tCell, onE - 0.448)) - 0.014) - 0.0030;
    ring = max(ring, 0.420 - onE);
    ring = max(ring, onE - 0.476);
    d.x = min(d.x, ring);
    return d;
  }

  /* DIAMONDS — row of small filled diamonds */
  vec4 frDiamonds(vec2 p) {
    vec4 d = vec4(INF);
    vec2 ap = abs(p);
    float onE = max(ap.x, ap.y);
    float t   = (ap.x > ap.y) ? p.y : p.x;
    /* rails */
    d.x = abs(onE - 0.476) - 0.0025;
    d.x = min(d.x, abs(onE - 0.420) - 0.0025);
    /* diamond row */
    float period = 0.044;
    float tCell = mod(t + period * 0.5, period) - period * 0.5;
    /* rotated square = diamond */
    vec2 dp = vec2(tCell, onE - 0.448);
    vec2 rdp = rot(dp, PI*0.25);
    float diamond = sdBox(rdp, vec2(0.012));
    diamond = max(diamond, 0.420 - onE);
    diamond = max(diamond, onE - 0.476);
    d.x = min(d.x, abs(diamond) - 0.0025);
    d.y = diamond;
    return d;
  }

  vec4 dispFrame(float idx, vec2 p) {
    if (idx < 0.5)  return frNone(p);
    if (idx < 1.5)  return frThin(p);
    if (idx < 2.5)  return frDouble(p);
    if (idx < 3.5)  return frThick(p);
    if (idx < 4.5)  return frBeaded(p);
    if (idx < 5.5)  return frCornerSq(p);
    if (idx < 6.5)  return frChevron(p);
    if (idx < 7.5)  return frRope(p);
    if (idx < 8.5)  return frPearls(p);
    if (idx < 9.5)  return frDentils(p);
    if (idx < 10.5) return frTriple(p);
    if (idx < 11.5) return frChain(p);
    return frDiamonds(p);
  }

  /* ============================================================
                              COMPOSE
     ============================================================ */
  void main() {
    vec2 p = vUv - 0.5;
    float imp = uImp;

    /* ── tile shape SDF — rounded square with a hand-cut "live edge" ──
       The tile occupies roughly [-0.46, 0.46] of the quad. Around it sits
       a thin grout strip out to ~0.474 — sized so that when two tiles are
       set adjacent, the combined grout joint between them reads at the
       proper architectural thickness. Beyond the grout is transparency, so
       the whole composite reads as a standalone, hand-set element. */
    const float TILE_HALF  = 0.460;
    const float CORNER_R   = 0.022;
    const float GROUT_HALF = 0.474;
    const float GROUT_CORNER_R = 0.024;

    /* tile boundary (live-edged) */
    vec2 tq = abs(p) - vec2(TILE_HALF - CORNER_R);
    float tileSDF = length(max(tq, 0.0)) + min(max(tq.x, tq.y), 0.0) - CORNER_R;

    /* live-edge perturbation on the tile — distinct fbm pattern per edge */
    {
      vec2 ap = abs(p);
      bool hEdge = (ap.y > ap.x);
      float along = hEdge ? p.x : p.y;
      float side  = hEdge ? sign(p.y) : sign(p.x);
      float axis  = hEdge ? 0.0 : 1.0;
      float pert = fbm(vec2(along * 6.5 + axis * 17.3, side * 9.1) + uIperf * 0.5) - 0.5;
      tileSDF += pert * 0.012 * (0.5 + 0.5 * imp);
    }

    /* outer grout boundary — its own rounded square with an independent
       live edge.  Slightly larger corner radius so the grout reads as a
       softer "frame" around the harder-cornered tile. */
    vec2 gq = abs(p) - vec2(GROUT_HALF - GROUT_CORNER_R);
    float groutOuterSDF = length(max(gq, 0.0)) + min(max(gq.x, gq.y), 0.0) - GROUT_CORNER_R;

    /* live-edge perturbation on the grout outer boundary — uses different
       phase so it isn't a simple offset of the tile boundary */
    {
      vec2 ap = abs(p);
      bool hEdge = (ap.y > ap.x);
      float along = hEdge ? p.x : p.y;
      float side  = hEdge ? sign(p.y) : sign(p.x);
      float axis  = hEdge ? 0.0 : 1.0;
      float pert = fbm(vec2(along * 5.3 + axis * 23.7 + 41.0, side * 7.9 + 13.0) + uIperf * 0.7) - 0.5;
      groutOuterSDF += pert * 0.007 * (0.5 + 0.5 * imp);
    }

    /* ── painter's registration — the design lands on the tile the way
       a hand guides it: a hair off-center, a hair rotated. The tile
       cut, grout, glaze, and lighting stay in true tile space; only
       the painting wobbles. Seeded per tile via uIperf, so every tile
       settles a little differently — one of the strongest "human hand"
       tells on real azulejos. Amplitudes are capped so border frames
       can graze, but never cross, the tile edge. */
    vec2  regOff = (hash22(uIperf * 1.7 + vec2(3.1, 43.7)) - 0.5) * 0.014;
    float regRot = (hash21(uIperf * 2.3 + vec2(7.7, 17.3)) - 0.5) * 0.045;
    vec2 mp = rot(p - regOff, regRot);

    /* kiln temperature drift for this firing — applied near the end */
    float kiln = hash21(uIperf * 3.1 + vec2(13.0, 29.0)) - 0.5;

    /* domain warp — slow + fast octaves */
    vec2 wLo = vec2(fbm(mp * 2.5 + uIperf), fbm(mp * 2.5 + uIperf + vec2(31.7, 12.3))) - 0.5;
    vec2 wHi = vec2(fbm(mp * 7.0 + uIperf), fbm(mp * 7.0 + uIperf + vec2(13.7, 22.3))) - 0.5;
    vec2 wp = mp + (wLo * 0.012 + wHi * 0.010) * imp;

    /* compose all SDF slots — straps merge with the main motif paint.
       Mutation: a second center/wrapper merges via SDF min; corners
       can run in bilateral mode (motif A on main diagonal, motif B
       on anti-diagonal) when uCornersB >= 0. */
    vec4 layers = vec4(INF);

    /* center — primary plus optional second center merged in */
    layers = mergeL(layers, dispCenter(uCenter, wp, uV1));
    if (uCenter2 > -0.5) {
      /* slightly smaller second center, distance-correct scaling */
      float s2 = 1.18;
      vec4 dC2 = dispCenter(uCenter2, wp * s2, uV2);
      dC2.x /= s2; dC2.y /= s2; dC2.z /= s2; dC2.w /= s2;
      layers = mergeL(layers, dC2);
    }

    /* wrapper — primary plus optional second wrapper at slightly different radius */
    layers = mergeL(layers, dispWrapper(uWrapper, wp, uV2));
    if (uWrapper2 > -0.5) {
      float s3 = 1.10;
      vec4 dW2 = dispWrapper(uWrapper2, wp * s3, uV1);
      dW2.x /= s3; dW2.y /= s3; dW2.z /= s3; dW2.w /= s3;
      layers = mergeL(layers, dW2);
    }

    /* ── per-motif hand jitter — every repeated corner/edge motif was
       its own brush event, so each quadrant (corners) and each side
       (edges) gets a hair of its own offset and rotation on top of the
       whole-design registration. Corner jitter is keyed by quadrant
       (its seams lie on the axes, where no corner motif lives); edge
       jitter by side (seams on the diagonals, away from the edge
       chains' midpoints) — so neither seam can cut through the motif
       it perturbs. Rotation and translation preserve SDF distances,
       so no scale correction is needed. */
    vec2 quadKey = sign(wp + 1e-4);
    vec2 wpQ = rot(wp - (hash22(uIperf + quadKey * 61.3) - 0.5) * 0.007,
                   (hash21(uIperf + quadKey * 23.1) - 0.5) * 0.035);
    float sideKey = (abs(wp.y) > abs(wp.x))
        ? sign(wp.y + 1e-4) * 2.0
        : sign(wp.x + 1e-4) * 3.0;
    vec2 wpE = rot(wp - (hash22(uIperf + vec2(sideKey * 17.7, 9.1)) - 0.5) * 0.006,
                   (hash21(uIperf + vec2(sideKey * 29.3, 4.7)) - 0.5) * 0.030);

    /* corners — bilateral mode if uCornersB >= 0:
       NE+SW (main diagonal) get motif A, NW+SE get motif B */
    if (uCornersB > -0.5) {
      vec4 cA = dispCorners(uCorners,  wpQ, uV1);
      vec4 cB = dispCorners(uCornersB, wpQ, uV2);
      bool mainDiag = (wp.x * wp.y) > 0.0;
      layers = mergeL(layers, mainDiag ? cA : cB);
    } else {
      layers = mergeL(layers, dispCorners(uCorners, wpQ, uV1));
    }
    layers = mergeL(layers, dispEdges  (uEdges,   wpE, uV2));
    layers = mergeL(layers, dispField  (uField,   wp, uV2));
    layers = mergeL(layers, dispStraps (uStraps,  wp));
    layers = mergeL(layers, dispFrame  (uFrame,   wp));

    /* ground SDF — rendered separately as a faint hand-painted texture
       beneath the main motif (see below, after background setup) */
    float groundSDF = dispGround(uGround, wp);

    /* ── clay substrate ──
       The base is a tin-glazed ceramic surface. Three structural layers:
       (1) low-frequency glaze-thickness variation — telegraphs the uneven
           clay body through translucent glaze;
       (2) "thin spots" where the glaze is thinner and the warm earthenware
           clay (~buff/peach) shows through more strongly;
       (3) micro-pores: tiny pin-hole darkening from firing imperfections. */
    vec3 clayWarmth = vec3(0.78, 0.62, 0.50);
    float glazeThick = fbm(p * 2.4 + uIperf * 0.5);
    float bgN = fbm(p * 4.0 + uIperf * 0.7);
    vec3 col = uBg * (0.92 + 0.16 * bgN);

    /* thin spots — warm clay breathing through the glaze */
    float thin = smoothstep(0.40, 0.20, glazeThick);
    col = mix(col, mix(col, clayWarmth, 0.35), thin * 0.55);

    /* micro-pores — firing pinhole specks */
    float pores = smoothstep(0.86, 0.92, fbm(p * 95.0 + uIperf * 3.1));
    col *= 1.0 - pores * 0.22;

    /* asymmetric warm stains (subtler than before) */
    float stain = smoothstep(0.55, 0.85, fbm(p * 2.2 + uIperf * 1.3));
    col = mix(col, col * vec3(0.93, 0.90, 0.82), stain * 0.22 * imp);

    col *= mix(1.0, 0.94, imp * 0.4);

    /* pigment density (clouds) and localized brush patches (highlights) */
    float br1 = pigmentDensity(p,         uIperf);
    float br2 = pigmentDensity(p + 5.0,   uIperf + 11.0);
    float bs1 = brushPatches(p,           uIperf);
    float bs2 = brushPatches(p + 3.7,     uIperf + 11.0);

    float lineWob   = (vnoise(p * 35.0 + uIperf) - 0.5) * 0.014 * imp;
    float fillBleed = (vnoise(p * 28.0 + uIperf + 5.0) - 0.5) * 0.008 * imp;

    /* low-frequency pigment density — large washes of "thicker" and
       "thinner" paint within each fill region, like real glaze pours.
       Computed once and shared across fills/accents for visual coherence. */
    float lfDensity1 = 0.82 + 0.32 * fbm(p * 3.2 + uIperf * 0.6);
    float lfDensity2 = 0.82 + 0.32 * fbm(p * 3.2 + uIperf * 0.6 + 17.0);

    /* ── ground ── faint hand-painted texture across the field.
       Painted in the outline color at very low opacity, with a soft
       fade near the tile edge so the wear/glaze can take over.
       This is a textural detail, not a feature — sits beneath everything
       and the main fills cover it where they appear. */
    float gdEdge = 1.0 - smoothstep(0.38, 0.49, max(abs(p.x), abs(p.y)));
    float gd = aapaint(fillBleed * 0.5, -groundSDF, p + 3.0);
    vec3 gdCol = uOl;
    col = mix(col, gdCol, gd * 0.22 * gdEdge);

    /* ── fill 1 ── pigment with large-scale density variation and a
       soft outer halo (pigment bleeding into wet glaze).
       The halo is rendered FIRST at low opacity outside the SDF body, so
       the boundary feels like wet paint, not a vector edge. */
    float f1Halo = smoothstep(0.020, 0.0, layers.y);   /* ring outside fill */
    vec3 c1 = uC1 * lfDensity1 * (1.0 - imp * 0.14 + 0.26 * br1 * imp);
    /* slight chromatic drift — pigment varies in hue across the wash */
    c1 = mix(c1, mix(c1, uC2, 0.18), fbm(p * 2.6 + uIperf) * 0.45);
    float f1 = aapaint(fillBleed, -layers.y, p);
    /* halo first — outside the SDF body, low opacity */
    col = mix(col, c1, f1Halo * (1.0 - f1) * 0.18 * imp);
    /* main body */
    float scum1 = 0.80 + 0.20 * fbm(p * 70.0 + uIperf);
    col = mix(col, c1, f1 * mix(1.0, scum1, imp * 0.6));
    col = mix(col, c1 * 1.12, f1 * bs1 * 0.28 * imp);

    /* ── fill 2 ── */
    float f2Halo = smoothstep(0.020, 0.0, layers.z);
    vec3 c2 = uC2 * lfDensity2 * (1.0 - imp * 0.14 + 0.26 * br2 * imp);
    c2 = mix(c2, mix(c2, uC1, 0.18), fbm(p * 2.6 + uIperf + 9.0) * 0.45);
    float f2 = aapaint(fillBleed * 1.2, -layers.z, p + 7.0);
    col = mix(col, c2, f2Halo * (1.0 - f2) * 0.18 * imp);
    float scum2 = 0.80 + 0.20 * fbm(p * 65.0 + uIperf + 3.0);
    col = mix(col, c2, f2 * mix(1.0, scum2, imp * 0.6));
    col = mix(col, c2 * 1.12, f2 * bs2 * 0.28 * imp);

    /* ── outlines ── translucent pigment with depth.
       Real cobalt/manganese pigment exhibits "edge accumulation" — when
       the brush stroke dries, surface tension pulls pigment toward the
       edges of the line, leaving a darker rim and a slightly lighter
       interior.  Plus a faint color halo where pigment diffused into
       the wet glaze before firing. */

    /* halo — soft outer ring of low-saturation outline color */
    float olHalo = smoothstep(0.012, 0.0, layers.x);
    vec3 olHaloCol = mix(uBg, uOl, 0.35);
    float ol = aapaint(lineWob, -layers.x, p + 13.0);
    col = mix(col, olHaloCol, olHalo * (1.0 - ol) * 0.22 * imp);

    /* outline pigment density varies along the stroke */
    float olDensity = 0.78 + 0.22 * fbm(p * 18.0 + uIperf);
    vec3 olC = uOl * olDensity;
    olC = mix(olC, olC * 1.10, br1 * imp * 0.30);

    /* edge accumulation — find proximity to the outline EDGE (where the
       SDF body is, but near its boundary).  Inside-but-near-edge gets a
       slight darkening, simulating coffee-ring pigment pooling. */
    float edgeProx = smoothstep(0.0, 0.0035, -layers.x) - smoothstep(0.0, 0.0010, -layers.x);
    edgeProx = max(0.0, edgeProx);

    /* base alpha — translucent so fills tint the outline */
    float olAlpha = 0.78 + 0.16 * fbm(p * 50.0 + uIperf);
    col = mix(col, olC, ol * olAlpha);
    /* darker edge accumulation pass */
    col = mix(col, olC * 0.78, ol * edgeProx * 0.55);

    /* ── accents ── */
    float acc = aapaint(fillBleed * 0.8, -layers.w, p + 21.0);
    vec3 c3 = uC3 * (0.85 + 0.30 * fbm(p * 3.5 + uIperf + 4.0)) * (1.0 - imp * 0.14 + 0.22 * br2 * imp);
    col = mix(col, c3, acc * 0.92);

    /* ── crackle, masked unevenly ── */
    float ck = vcrack((p + 0.5) * 18.0 + uIperf);
    float crackMask = 1.0 - smoothstep(0.0, 0.022, ck);
    crackMask *= smoothstep(0.30, 0.70, fbm(p * 3.0 + uIperf * 0.5)) * 0.7 + 0.3;
    col = mix(col, col * 0.74, crackMask * 0.32 * imp);

    /* ── iron / firing spots ── */
    float spot = smoothstep(0.80, 0.86, fbm(p * 9.0 + uIperf * 1.7));
    col = mix(col, vec3(0.28, 0.18, 0.10), spot * 0.22 * imp);

    /* ── glaze crawl — a rare bare patch where the glaze pulled back
       in the kiln and the biscuit shows through, taking the painted
       design with it. Gated per tile: most tiles have none, so when
       one appears it reads as that tile's personal flaw rather than
       a house style. A glassy rim marks where the glaze beaded up. */
    float crawlGate = step(0.62, hash21(uIperf * 5.7 + vec2(19.0, 3.0)));
    float crawlN = fbm(p * 7.0 + uIperf * 4.3);
    float crawl = smoothstep(0.865, 0.94, crawlN) * crawlGate;
    float crawlRim = (smoothstep(0.80, 0.865, crawlN) -
                      smoothstep(0.865, 0.94, crawlN)) * crawlGate;
    vec3 crawlCol = clayWarmth * (0.86 + 0.18 * fbm(p * 55.0 + uIperf + 31.0));
    col = mix(col, col * 1.06, max(crawlRim, 0.0) * 0.5);
    col = mix(col, crawlCol, crawl * 0.85);

    /* ── age fade — a soft abraded patch (about a quarter of tiles)
       where decades of touch dulled the pigment back toward the
       glaze. Painted areas lighten; bare glaze barely moves, so it
       reads as wear on the design, not a smudge on the photo. */
    float fadeGate = step(0.75, hash21(uIperf * 9.3 + vec2(2.0, 41.0)));
    vec2 fadeC = (hash22(uIperf + vec2(19.0, 57.0)) - 0.5) * 0.5;
    float fadeR = 0.12 + 0.16 * hash21(uIperf + vec2(67.0, 3.0));
    float fade = (1.0 - smoothstep(fadeR * 0.35, fadeR, length(p - fadeC))) * fadeGate;
    fade *= 0.55 + 0.45 * fbm(p * 9.0 + uIperf + 23.0);
    col = mix(col, mix(col, uBg, 0.6), fade * 0.4);

    /* ── edge wear — concentrated near the tile boundary, asymmetric ── */
    float wearMask = smoothstep(-0.030, 0.000, tileSDF);
    float sideMask = 0.4 + 0.8 * fbm(p * 1.2 + uIperf * 2.0);
    float wear = wearMask * (0.30 + 0.70 * fbm(p * 30.0 + uIperf)) * sideMask;
    wear = smoothstep(0.30, 1.0, wear);
    col = mix(col, uBg * 0.84, wear * 0.55 * imp);

    /* ── glaze surface ──
       A real tin glaze is glassy and slightly uneven.  Light catches it
       in multiple places, not just one.  Three contributions:
       (1) primary diagonal sheen from upper-left light source;
       (2) secondary softer highlight from a fill-light direction;
       (3) glaze ripples — fine sinusoidal modulation of brightness that
           reads as the imperfect, slightly wavy surface of fired glass. */

    /* primary highlight — upper-left soft diagonal */
    vec2 sg1 = vUv - vec2(0.30, 0.72);
    float spec1 = exp(-dot(sg1, sg1) * 4.5) * 0.085;

    /* secondary fill highlight — lower-right, much softer */
    vec2 sg2 = vUv - vec2(0.70, 0.32);
    float spec2 = exp(-dot(sg2, sg2) * 8.0) * 0.030;

    /* glaze ripples — very fine fbm modulating the highlight intensity,
       so it doesn't read as a smooth airbrush gradient */
    float rippleA = fbm(p * 14.0 + uIperf * 0.4);
    float rippleB = fbm(p * 38.0 + uIperf * 0.9);
    float ripple = (rippleA * 0.6 + rippleB * 0.4) - 0.5;

    /* combine — the rippling modulates the specular, and the specular
       bumps brightness without washing out color */
    col += (spec1 + spec2) * (0.85 + 0.30 * ripple) * (1.0 - 0.35 * imp);

    /* subsurface scatter hint — a tiny brightening in the upper half
       that simulates light entering and bouncing within the glassy
       glaze layer */
    float sss = smoothstep(0.0, 0.5, vUv.y) * 0.018 * (1.0 - 0.5 * imp);
    col *= 1.0 + sss;

    /* tile vignette — applied before grout so grout stays uniform */
    col *= 1.0 - dot(p, p) * 0.13;

    /* ── kiln drift — each firing leans a touch warm or cool, so tiles
       from "different batches" sit differently against each other.
       Applied to the tile only; grout is post-firing cement. */
    col *= mix(vec3(1.025, 1.0, 0.972), vec3(0.975, 1.0, 1.028), 0.5 + kiln);

    /* ── corner chips — each corner rolls independently for a seeded
       bite where the glaze flaked and the warm biscuit shows. The
       fracture line is fbm-roughened (conchoidal, not a neat disc)
       and a darker rim marks the broken glaze edge. Matte: applied
       after the specular pass, like the crawl. */
    {
      vec3 biscuit = clayWarmth * (0.82 + 0.22 * fbm(p * 40.0 + uIperf));
      for (int i = 0; i < 4; i++) {
        float fi = float(i);
        float hRoll = hash21(uIperf + vec2(fi * 37.0, 11.0));
        if (hRoll > 0.76) {
          vec2 cs = vec2((i == 0 || i == 3) ? 1.0 : -1.0, (i < 2) ? 1.0 : -1.0);
          vec2 off = (hash22(uIperf + vec2(fi * 71.0, 5.0)) - 0.5) * 0.02;
          float chipR = 0.016 + 0.030 * hash21(uIperf + vec2(fi * 53.0, 29.0));
          float chipSDF = length(p - (cs * 0.460 + off)) - chipR;
          chipSDF += (fbm(p * 60.0 + uIperf + fi * 9.0) - 0.5) * 0.014;
          float inTile = 1.0 - smoothstep(-0.001, 0.001, tileSDF);
          float chip = (1.0 - smoothstep(-0.002, 0.002, chipSDF)) * inTile;
          float rim = smoothstep(-0.009, -0.002, chipSDF) -
                      smoothstep(-0.002, 0.002, chipSDF);
          col = mix(col, col * 0.72, max(rim, 0.0) * inTile * 0.8);
          col = mix(col, biscuit, chip);
        }
      }
    }

    /* ── structural hairline — a rare (about 1 in 7) long crack that
       meanders edge to edge: a dark seam plus a faint light catch
       alongside where the glaze edges tip toward the light. Distinct
       from the fine craquelure net — this is the tile's one big scar. */
    float hairGate = step(0.86, hash21(uIperf * 7.9 + vec2(5.0, 23.0)));
    if (hairGate > 0.5) {
      float hairAng = hash21(uIperf + vec2(77.0, 1.0)) * PI;
      vec2 hairN = vec2(cos(hairAng), sin(hairAng));
      float hairOff = (hash21(uIperf + vec2(91.0, 8.0)) - 0.5) * 0.5;
      float along = dot(p, vec2(-hairN.y, hairN.x));
      float hairD = dot(p, hairN) - hairOff
                  + (fbm(vec2(along * 5.0, 3.7) + uIperf) - 0.5) * 0.06;
      float inTileH = 1.0 - smoothstep(-0.006, 0.0, tileSDF);
      float hair = (1.0 - smoothstep(0.0004, 0.0020, abs(hairD))) * inTileH;
      float hairLite = (1.0 - smoothstep(0.0010, 0.0040, abs(hairD - 0.0045))) * inTileH;
      col = mix(col, col * 0.58, hair * 0.60);
      col = mix(col, col * 1.10, hairLite * 0.50);
    }

    /* ── grout border ──
       Cement between tiles. Color is computed JS-side from the palette and
       seed (see pickGroutColor) so each tile gets a contrasting accent
       that harmonizes with its motifs without always being the same hue. */
    {
      /* coarse grain — the gritty texture of dried mortar */
      float gGrain = hash21(vUv * uRes * 1.1 + uIperf);
      float gFbm   = fbm(p * 28.0 + uIperf * 2.3);
      vec3 groutCol = uGrout * (0.82 + 0.34 * gGrain) * (0.88 + 0.24 * gFbm);

      /* subtle inner shadow on the tile near the grout edge */
      float innerSh = smoothstep(-0.022, -0.004, tileSDF);
      col = mix(col, col * 0.62, innerSh * 0.55);

      /* composite grout over tile in grout zone */
      float groutMask = smoothstep(-0.0015, 0.0015, tileSDF);
      col = mix(col, groutCol, groutMask);
    }

    /* ── Bayer-dither grain ──
       Combination of an ordered Bayer dither (gives a structured halftone
       quality that reads as fired ceramic) and a small amount of hash
       noise (breaks the regularity).  Applied at the end so all the
       smooth gradients above get broken up into a tactile, slightly
       grainy surface. */
    vec2 fragPx = vUv * uRes;
    float dith  = bayer8(fragPx);
    float hashG = (hash21(fragPx + uIperf) - 0.5);
    /* 70% Bayer + 30% hash — blue-noise-like quality without the cost.
       Strength: 0.022 baseline, scaled up slightly with imperfection */
    float ditherAmt = (dith * 0.70 + hashG * 0.30) * (0.022 + 0.014 * imp);
    col += ditherAmt;

    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, vec3(lum), imp * 0.05);

    /* ── alpha — fades to transparent outside the grout outer boundary ──
       This makes the tile + grout read as a single standalone element,
       not a grid filling the canvas. */
    float alpha = 1.0 - smoothstep(-0.0015, 0.0015, groutOuterSDF);

    gl_FragColor = vec4(col, alpha);
  }
`;
