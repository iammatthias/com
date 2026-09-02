const ze = ':root{color-scheme:light dark;color:#232326;background:#f3f3f1}:root,:host{font-family:ui-serif,Georgia,Cambria,Times New Roman,Times,serif;--data-font: ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", monospace;--ink-muted: color-mix(in srgb, currentColor 78%, transparent);--hairline: color-mix(in srgb, currentColor 40%, transparent);--tick: color-mix(in srgb, currentColor 34%, transparent);--space-xs: .375rem;--space-s: .75rem;--space-m: 1rem;--space-l: 1.75rem;--space-xl: 3rem}*{box-sizing:border-box}[hidden]{display:none!important}:where(h1,h2,h3,h4,p){margin:0}body{width:min(100%,42rem);min-block-size:100vh;margin:0;padding:var(--space-xl) var(--space-l);line-height:1.55}.wordmark{font-size:1.75rem;font-weight:700;letter-spacing:-.02em;line-height:1}.stack,.cluster,.split{--layout-gap: var(--space-m);gap:var(--layout-gap)}.stack{display:flex;flex-direction:column;justify-content:flex-start}.cluster{display:flex;flex-wrap:wrap;align-items:center}.split{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between}.gap-xs{--layout-gap: var(--space-xs)}.gap-s{--layout-gap: var(--space-s)}.gap-l{--layout-gap: var(--space-l)}.gap-xl{--layout-gap: var(--space-xl)}main,section{min-width:0}label{display:block}button,input{font:inherit}code,button,output,summary,input[type=text],input[type=number],.frequency-tuner{font-family:var(--data-font)}button,summary,input[type=text],input[type=number]{font-size:.8125rem}a{color:inherit}.receiver label{font-family:var(--data-font);font-size:.6875rem;font-weight:400;letter-spacing:.14em;text-transform:uppercase}#frequency-readout{font-size:.8125rem;color:var(--ink-muted)}#receiver-state{font-size:.75rem;color:var(--ink-muted)}#receiver-state[data-state=ready],#receiver-state[data-state=error]{color:inherit}button,input:not([type=range]){min-block-size:2.125rem;padding:.35rem .6rem}button{flex:none;-webkit-appearance:none;appearance:none;border:1px solid var(--hairline);border-radius:0;background:transparent;color:inherit}button:enabled{cursor:pointer}:where(button,input,audio,summary):focus-visible{outline:2px solid LinkText;outline-offset:2px}summary,label{cursor:pointer}summary{color:var(--ink-muted);list-style:none}summary::-webkit-details-marker{display:none}summary:before{content:"▸";display:inline-block;width:1.2em}details[open]>summary:before{content:"▾"}details[open]>summary,summary:hover{color:inherit}input[type=text]{width:100%}.joined-control input{flex:1 1 20rem;width:auto;min-width:0}.joined-control button{align-self:stretch}.dial-window{padding-block:var(--space-xs);border-block:1px solid var(--hairline)}#frequency-dial{width:100%;-webkit-appearance:none;appearance:none;margin:0;padding:0;min-block-size:2rem;background:repeating-linear-gradient(to right,var(--tick) 0 1px,transparent 1px .625rem) center / 100% .625rem no-repeat;cursor:ew-resize;touch-action:pan-y}#frequency-dial::-webkit-slider-runnable-track{block-size:1px;background:currentColor}#frequency-dial::-webkit-slider-thumb{width:1.25rem;height:2rem;margin-top:calc(-1rem + .5px);-webkit-appearance:none;appearance:none;border:0;border-radius:0;box-shadow:none;background:linear-gradient(to right,transparent calc(50% - 1px),currentColor calc(50% - 1px),currentColor calc(50% + 1px),transparent calc(50% + 1px))}#frequency-dial::-moz-range-track{block-size:1px;background:currentColor}#frequency-dial::-moz-range-thumb{width:1.25rem;height:2rem;border:0;border-radius:0;background:linear-gradient(to right,transparent calc(50% - 1px),currentColor calc(50% - 1px),currentColor calc(50% + 1px),transparent calc(50% + 1px))}#frequency-dial:disabled{opacity:.45;cursor:not-allowed}#frequency-address{font-size:.75rem;color:var(--ink-muted)}.replay-tune{align-items:center;flex-wrap:wrap}.replay-tune label,.direct-tune label{font-size:.6875rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted)}.replay-tune input[type=range]{flex:1 1 8rem;min-width:0}.replay-tune input[type=number]{flex:0 1 6.5rem}.transport-button{min-block-size:2rem;min-inline-size:2rem;padding:.25rem .4rem;border:0;color:inherit;background:transparent}.transport-button:enabled:hover{text-decoration:underline;text-underline-offset:.2em}.transport-button:disabled{opacity:.4}#block-scrubber{-webkit-appearance:none;appearance:none;margin:0;padding:0;min-block-size:1.5rem;background:transparent}#block-scrubber::-webkit-slider-runnable-track{block-size:1px;background:var(--hairline)}#block-scrubber::-webkit-slider-thumb{width:1rem;height:1rem;margin-top:calc(-.5rem + .5px);-webkit-appearance:none;appearance:none;border:0;border-radius:0;box-shadow:none;background:linear-gradient(to right,transparent calc(50% - 1px),currentColor calc(50% - 1px),currentColor calc(50% + 1px),transparent calc(50% + 1px))}#block-scrubber::-moz-range-track{block-size:1px;background:var(--hairline)}#block-scrubber::-moz-range-thumb{width:1rem;height:1rem;border:0;border-radius:0;background:linear-gradient(to right,transparent calc(50% - 1px),currentColor calc(50% - 1px),currentColor calc(50% + 1px),transparent calc(50% + 1px))}#block-scrubber:disabled{opacity:.45}.transmission-log{font-family:var(--data-font);font-size:.8125rem;line-height:1.6}.transmission-log h2{font-size:.6875rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted);font-weight:400;margin:0}#transmission-count{font-size:.6875rem;color:var(--ink-muted)}.transmission-log tbody{transition:opacity .18s ease}.transmission-log[aria-busy=true] tbody{opacity:.4}tr.arrived{animation:arrive .36s ease-out}@keyframes arrive{0%{opacity:0}}@media(prefers-reduced-motion:reduce){.transmission-log tbody{transition:none}tr.arrived{animation:none}}table{width:100%;border-collapse:collapse}caption,th,td{padding:.3rem .75rem .3rem 0;text-align:left;vertical-align:top}th:last-child,td:last-child{padding-inline-end:0}thead th{font-size:.6875rem;font-weight:400;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted);border-block-end:1px solid var(--hairline)}td:last-child,code,output{overflow-wrap:anywhere}footer{padding-block-start:var(--space-m);border-block-start:1px solid var(--hairline);font-size:.875rem}footer a{color:var(--ink-muted)}.agent-handoff h2{font-family:var(--data-font);font-size:.6875rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted);font-weight:400;margin:0}.agent-prompt{margin:0;padding:var(--space-s);border:1px solid var(--hairline);font-size:.75rem;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere}#copy-agent-prompt{align-self:baseline;min-block-size:0;padding:0;font-family:var(--data-font);font-size:.8125rem}.skip-link:not(:focus){position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}@media(prefers-color-scheme:dark){:root{color:#e8e8e5;background:#171719}}@media(max-width:40rem){body{padding:var(--space-l) var(--space-m)}.joined-control>*{flex:1 1 100%}#block-scrubber{flex-basis:100%}}.chain-link{color:inherit;text-decoration-color:color-mix(in oklab,currentColor 35%,transparent);text-underline-offset:.2em}.chain-link:hover,.chain-link:focus-visible{text-decoration-color:currentColor}.block-cell{white-space:nowrap}.block-cell .chain-link+.chain-link{margin-inline-start:.5ch;font-size:.6875rem;opacity:.6}.visually-hidden{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}:host{display:block}.receiver-embed{line-height:1.55}.receiver-embed .transmission-log{max-block-size:var(--conet-tuner-log-height, 28rem);overflow-y:auto;overscroll-behavior:contain}.receiver-embed .transmission-log thead th{position:sticky;inset-block-start:0;background:inherit}';
class xe extends Error {
  constructor(o) {
    super(`fragment request failed with ${o}`), this.status = o;
  }
  status;
}
function Re(g, o) {
  const s = (e) => {
    const t = g.querySelector(`#${e}`);
    if (!t) throw new Error(`Missing #${e}`);
    return t;
  }, v = s("frequency-dial"), Se = s("frequency-marks"), z = s("frequency-readout"), R = s("frequency-address"), y = g.querySelector("#station-address") ?? void 0, ue = g.querySelector("#tune-form") ?? void 0, pe = s("receiver-state"), me = s("station-panel"), T = s("transmissions"), B = s("transmission-staging"), qe = s("transmission-log"), A = s("transmission-count"), ne = s("station-list"), Ie = s("replay-form"), l = s("block-scrubber"), f = s("block-anchor"), F = s("block-position"), re = s("replay-from-block"), X = s("return-live");
  let b = "", N = !1, $ = 0n, w;
  const _ = /* @__PURE__ */ new Map();
  let E = !1, ae = 0, O, G, D = "", p, q = "catchup", P = 0, I = 0, ie = "", x, K = !1, Y = !1, U = !1, Z = !1, J, C;
  y && ue && (y.addEventListener("focus", () => y.select()), ue.addEventListener("submit", (e) => {
    e.preventDefault();
    const t = te(y.value);
    if (!t) {
      k("Enter a valid Station address", "error"), y.focus();
      return;
    }
    L(t);
  })), v.addEventListener("input", le), v.addEventListener("change", Ae), v.addEventListener("pointerdown", () => {
    U = !0;
  }), l.addEventListener("input", () => {
    f.value = l.value, F.value = `Block ${l.value}`;
  }), f.addEventListener("input", () => {
    const e = Number.parseInt(f.value, 10);
    if (!Number.isSafeInteger(e)) return;
    const t = Number.parseInt(l.min, 10), n = Number.parseInt(l.max, 10);
    e >= t && e <= n && (l.value = String(e)), F.value = `Block ${f.value || "—"}`;
  }), Ie.addEventListener("submit", (e) => {
    if (e.preventDefault(), !b || l.disabled) return;
    const t = Number.parseInt(f.value, 10);
    !Number.isSafeInteger(t) || t < 0 || Le(t);
  }), X.addEventListener("click", () => {
    b && L(b);
  });
  const fe = (e) => {
    e.persisted && (Y = !1, oe(), b && L(b));
  };
  window.addEventListener("pointerup", Q), window.addEventListener("pointercancel", Q), window.addEventListener("pagehide", de), window.addEventListener("pageshow", fe), oe();
  const be = o.station ? te(o.station) : void 0;
  return be && L(be), {
    tune: L,
    destroy() {
      de(), window.removeEventListener("pointerup", Q), window.removeEventListener("pointercancel", Q), window.removeEventListener("pagehide", de), window.removeEventListener("pageshow", fe);
    }
  };
  async function he(e, t) {
    const n = await fetch(`${o.origin}${e}`, { signal: t, headers: { accept: "text/html" } });
    if (!n.ok) throw new xe(n.status);
    return n.text();
  }
  function L(e) {
    j(), I += 1, b = e, N = !1, $ = 0n, w = void 0, D = "", q = "catchup", p !== void 0 && window.clearTimeout(p), p = void 0, y && (y.value = e), me.hidden = !1, B.replaceChildren(), T.querySelector("tr[data-transmission]") ? M(!0) : H("Tuning…"), A.value = "…", l.disabled = !0, f.disabled = !0, re.disabled = !0, X.disabled = !0, F.value = "Block —", k("Tuning…"), ce(), ke();
  }
  function Ce() {
    const e = V()?.station.toLowerCase();
    for (const a of ne.querySelectorAll("[data-known-frequency]")) {
      const d = te(a.dataset.tuneStation ?? ""), c = a.dataset.stationId ?? "";
      !d || !/^[1-9]\d*$/.test(c) || _.set(d.toLowerCase(), { station: d, stationId: c });
    }
    const t = ne.querySelector("[data-station-cursor]"), n = t?.dataset.stationTotal;
    n && /^\d+$/.test(n) && (ae = Math.max(ae, Number(n)));
    const r = t?.dataset.stationCursor, i = t?.dataset.chainHead;
    if (r && i && /^\d+:-?\d+$/.test(r) && /^\d+$/.test(i)) {
      ie = r;
      const a = BigInt(r.split(":", 1)[0]), d = BigInt(i);
      E = a > d, se(E ? 12e3 : 0);
    } else
      se(4e3);
    ce(e);
  }
  function oe() {
    if (Y || K) return;
    x !== void 0 && window.clearTimeout(x), x = void 0, K = !0, G = new AbortController();
    const e = ie ? `&cursor=${encodeURIComponent(ie)}` : "";
    he(`/_tuner/factory/stations?limit=1000${e}`, G.signal).then((t) => {
      ne.innerHTML = t, Ce();
    }).catch((t) => {
      t instanceof DOMException && t.name === "AbortError" || (z.value = "Factory signal unavailable · retrying", se(4e3));
    }).finally(() => {
      K = !1;
    });
  }
  function se(e) {
    Y || (x !== void 0 && window.clearTimeout(x), x = window.setTimeout(oe, e));
  }
  function ge() {
    return Array.from(_.values()).sort((e, t) => {
      const n = BigInt(e.stationId), r = BigInt(t.stationId);
      return n < r ? -1 : n > r ? 1 : 0;
    });
  }
  function ce(e) {
    if (!E && _.size === 0) {
      v.disabled = !0, b || (z.value = "Scanning factory events…", R.textContent = "No Station selected");
      return;
    }
    if (U) {
      Z = !0, J = V()?.station.toLowerCase() || e;
      return;
    }
    const t = ge(), n = e || b.toLowerCase(), r = n ? t.find((h) => h.station.toLowerCase() === n) : void 0, i = t.reduce(
      (h, m) => Math.max(h, Number(m.stationId)),
      0
    ), a = Math.max(ae, i), d = Math.ceil(t.length / 64), c = [];
    for (let h = 0; h < t.length; h += d) {
      const m = document.createElement("option");
      m.value = String(t[h].stationId), m.label = `Station ${t[h].stationId}`, c.push(m);
    }
    Se.replaceChildren(...c), v.min = "0", v.max = String(a), v.disabled = a === 0, v.value = r ? String(r.stationId) : v.value || "0", le();
  }
  function Q() {
    if (!U || (U = !1, !Z)) return;
    const e = J;
    Z = !1, J = void 0, C !== void 0 && window.clearTimeout(C), C = window.setTimeout(() => {
      C = void 0, ce(e);
    }, 0);
  }
  function V() {
    const e = Number.parseInt(v.value, 10);
    if (!(!Number.isSafeInteger(e) || e < 1))
      return ge().find((t) => Number(t.stationId) === e);
  }
  function Te(e) {
    if (!o.explorerUrl) {
      R.textContent = e;
      return;
    }
    const t = document.createElement("a");
    t.className = "chain-link", t.href = `${o.explorerUrl}/address/${e}`, t.target = "_blank", t.rel = "noreferrer noopener", t.textContent = e, R.replaceChildren(t);
  }
  function le() {
    const e = V();
    if (e) {
      z.value = `Station ${e.stationId}`, Te(e.station);
      return;
    }
    const t = Number.parseInt(v.value, 10);
    if (Number.isSafeInteger(t) && t >= 1 && !E) {
      z.value = `Station ${t} · not yet received`, R.textContent = "No Station selected";
      return;
    }
    z.value = _.size === 0 ? E ? "No frequencies issued" : "Scanning factory events…" : E ? "Off band" : `Off band · ${_.size} found`, R.textContent = "No Station selected";
  }
  function Ae() {
    const e = V();
    if (ve(), !e) {
      Ne();
      return;
    }
    y && (y.value = e.station), e.station.toLowerCase() !== b.toLowerCase() && L(e.station);
  }
  function Ne() {
    I += 1, j(), p !== void 0 && window.clearTimeout(p), p = void 0, b = "", N = !1, $ = 0n, w = void 0, P = 0, D = "", q = "catchup", y && (y.value = ""), me.hidden = !0, B.replaceChildren(), M(!1), A.value = "0", H("Choose a frequency or enter a Station address."), l.min = "0", l.max = "0", l.value = "0", l.disabled = !0, f.min = "0", f.removeAttribute("max"), f.value = "0", f.disabled = !0, re.disabled = !0, X.disabled = !0, F.value = "Block —", k("Not tuned"), le();
  }
  function ve() {
    Z = !1, J = void 0, C !== void 0 && window.clearTimeout(C), C = void 0;
  }
  function H(e) {
    const t = document.createElement("tr"), n = document.createElement("td");
    n.colSpan = 3, n.textContent = e, t.append(n), T.replaceChildren(t);
  }
  function $e(e) {
    const t = Array.from(
      e.querySelectorAll("tr[data-transmission-cursor]")
    ), n = t.at(-1), r = n?.dataset.transmissionCursor, i = n?.dataset.chainHead, a = n?.dataset.scanFloor;
    t.forEach((u) => u.remove()), q !== "replay" && r && (D = r);
    const d = Array.from(e.querySelectorAll("tr[data-transmission]")), c = d.map(Me).filter((u) => u !== void 0).sort(Be), h = new Map(d.map((u) => [u.dataset.seq ?? "", u]));
    for (const u of c.slice(-80)) {
      const S = h.get(u.seq.toString());
      S && e.append(S);
    }
    for (; e.querySelectorAll("tr[data-transmission]").length > 80; )
      e.querySelector("tr[data-transmission]")?.remove();
    w = c.at(-1);
    const m = i && /^\d+$/.test(i) ? Number.parseInt(i, 10) : void 0, ee = a && /^\d+$/.test(a) ? Number.parseInt(a, 10) : void 0;
    if (m !== void 0 && ee !== void 0 && Number.isSafeInteger(m) && Number.isSafeInteger(ee) && (l.min = String(ee), l.max = String(m), f.min = String(ee), f.max = String(m), q !== "replay" && (l.value = String(m), f.value = String(m), F.value = `Block ${m}`)), q === "replay") {
      if (c.length === 0 && r && m !== void 0) {
        const u = Number.parseInt(r.split(":", 1)[0], 10);
        if (Number.isSafeInteger(u) && u <= m) {
          we(r);
          return;
        }
      }
      c.length === 0 && H(`No transmission at or after block ${P}`), A.value = String(c.length), M(!1), k(
        c.length > 0 ? `Replay · block ${P} · seq ${c[0].seq}` : `No transmission at or after block ${P}`,
        "ready"
      );
      return;
    }
    if (!N) {
      const u = r ? BigInt(r.split(":", 1)[0]) : 0n, S = i && /^\d+$/.test(i) ? BigInt(i) : void 0;
      if (!(S !== void 0 && u > S)) {
        k(`Tuning · scanned through seq ${w?.seq ?? 0n}`), W(0);
        return;
      }
      N = !0, $ = w?.seq ?? 0n, Ee(), l.disabled = !1, f.disabled = !1, re.disabled = !1, k(w ? "Tuned" : "Tuned · carrier quiet", "ready"), W(4e3);
      return;
    }
    for (const u of d) {
      const S = u.dataset.seq;
      S && BigInt(S) > $ && u.classList.add("arrived");
    }
    w && w.seq > $ && ($ = w.seq, k("Tuned", "ready")), A.value = String(T.querySelectorAll("tr[data-transmission]").length), W(4e3);
  }
  function Ee() {
    const e = Array.from(B.querySelectorAll("tr[data-transmission]"));
    e.length > 0 ? T.replaceChildren(...e) : H("Carrier quiet"), B.replaceChildren(), A.value = String(e.length), M(!1);
  }
  function M(e) {
    qe.setAttribute("aria-busy", String(e));
  }
  function ye(e, t, n) {
    j();
    const r = I, i = new AbortController();
    O = i, he(e, i.signal).then((a) => {
      r === I && (n ? t.innerHTML = a : t.insertAdjacentHTML("beforeend", a), $e(t));
    }).catch((a) => {
      if (r === I && !(a instanceof DOMException && a.name === "AbortError")) {
        if (M(!1), a instanceof xe && a.status === 404) {
          H("Frequency not found in this factory"), A.value = "0", k("Frequency not found in this factory", "error");
          return;
        }
        k("Carrier unavailable · retrying", "error"), W(4e3);
      }
    }).finally(() => {
      O === i && (O = void 0);
    });
  }
  function ke() {
    if (!b) return;
    q = N ? "live" : "catchup";
    const e = D ? `&cursor=${encodeURIComponent(D)}` : "";
    ye(
      `/_tuner/stations/${encodeURIComponent(b)}/transmissions?limit=80${e}`,
      N ? T : B,
      !1
    );
  }
  function Le(e) {
    p !== void 0 && window.clearTimeout(p), p = void 0, j(), I += 1, P = e, X.disabled = !1, M(!0), k(`Finding transmissions from block ${e}…`), we(`${e}:-1`);
  }
  function we(e) {
    q = "replay", ye(
      `/_tuner/stations/${encodeURIComponent(b)}/transmissions?limit=80&cursor=${encodeURIComponent(e)}`,
      T,
      !0
    );
  }
  function W(e) {
    p !== void 0 && window.clearTimeout(p), p = window.setTimeout(ke, e);
  }
  function Me(e) {
    const t = te(e.dataset.station ?? b), n = e.dataset.stationId ?? "", r = e.dataset.seq ?? "", i = Number.parseInt(e.dataset.block ?? "", 10), a = e.dataset.nonce ?? "", d = Number.parseInt(e.dataset.kind ?? "", 10), c = (e.dataset.cipher ?? "").replace(/^0x/i, ""), h = c.length / 2;
    if (!(!t || !/^[1-9]\d*$/.test(n) || !/^[1-9]\d*$/.test(r) || !Number.isSafeInteger(i) || i < 0 || !/^[0-9a-f]{16}$/.test(a) || !Number.isSafeInteger(d) || d < 0 || d > 255 || !/^[0-9a-f]+$/i.test(c) || !Number.isSafeInteger(h) || h < 1))
      return { station: t, stationId: n, seq: BigInt(r), block: i, nonce: a, kind: d, cipher: c, byteCount: h };
  }
  function de() {
    Y = !0, U = !1, ve(), I += 1, j(), G?.abort(), G = void 0, K = !1, x !== void 0 && window.clearTimeout(x), x = void 0, p !== void 0 && window.clearTimeout(p), p = void 0;
  }
  function j() {
    O?.abort(), O = void 0;
  }
  function k(e, t) {
    pe.textContent = e, pe.dataset.state = t ?? "working";
  }
}
function Be(g, o) {
  return g.seq < o.seq ? -1 : g.seq > o.seq ? 1 : 0;
}
function te(g) {
  const o = g.trim();
  return /^0x[0-9a-f]{40}$/i.test(o) ? o : void 0;
}
const Fe = `
    <section
        class="frequency-tuner stack gap-s"
        aria-labelledby="frequency-title"
    >
        <header class="split gap-s">
            <label id="frequency-title" for="frequency-dial"
                >Frequency</label
            >
            <output
                id="frequency-readout"
                for="frequency-dial"
                aria-live="polite"
                >Scanning factory events…</output
            >
        </header>
        <div class="dial-window stack gap-xs">
            <input
                id="frequency-dial"
                type="range"
                min="0"
                max="0"
                value="0"
                step="1"
                list="frequency-marks"
                disabled
            />
            <datalist id="frequency-marks"></datalist>
        </div>
        <div class="split gap-s">
            <code
                id="frequency-address"
                >No Station selected</code
            >
            <output id="receiver-state" aria-live="polite"
                >Not tuned</output
            >
        </div>
    </section>

    <div id="station-list" hidden></div>

    <div id="station-panel" class="stack gap-l" hidden>

        <section
            id="transmission-log"
            class="transmission-log stack gap-s"
            aria-labelledby="transmission-log-title"
            aria-busy="false"
        >
            <header class="split gap-s">
                <h2 id="transmission-log-title">
                    Transmission log
                </h2>
                <output id="transmission-count">0</output>
            </header>
            <table>
                <thead>
                    <tr>
                        <th scope="col">Seq</th>
                        <th scope="col">Block</th>
                        <th scope="col">Five-figure body</th>
                    </tr>
                </thead>
                <tbody id="transmissions">
                    <tr>
                        <td colspan="3">
                            Choose a frequency or enter a Station
                            address.
                        </td>
                    </tr>
                </tbody>
                <tbody id="transmission-staging" hidden></tbody>
            </table>
        </section>

        <form id="replay-form" class="replay-tune cluster gap-s">
            <label for="block-anchor">Go to block</label>
            <input
                id="block-scrubber"
                aria-label="Replay start block slider"
                type="range"
                min="0"
                max="0"
                value="0"
                step="1"
                disabled
            />
            <input
                id="block-anchor"
                name="block"
                type="number"
                min="0"
                value="0"
                step="1"
                inputmode="numeric"
                aria-label="Exact replay start block"
                disabled
            />
            <button
                id="replay-from-block"
                class="transport-button"
                type="submit"
                disabled
            >
                Load
            </button>
            <button
                id="return-live"
                class="transport-button"
                type="button"
                disabled
            >
                Live
            </button>
            <output id="block-position" for="block-scrubber" hidden
                >Block —</output
            >
        </form>
    </div>

`, _e = `
    <form id="tune-form" class="direct-tune stack gap-xs">
        <label for="station-address">Tune by address</label>
        <div class="joined-control cluster gap-xs">
            <input
                id="station-address"
                name="station"
                type="text"
                autocomplete="off"
                autocapitalize="none"
                spellcheck="false"
                data-1p-ignore
                data-lpignore="true"
                data-bwignore
                placeholder="0x0000…0000"
                pattern="0x[0-9a-fA-F]{40}"
                minlength="42"
                maxlength="42"
                required
            />
            <button type="submit">Tune</button>
        </div>
    </form>
`;
function Oe(g = { tuneByAddress: !0 }) {
  return `<section class="receiver stack gap-l" aria-label="Receiver">${Fe}${g.tuneByAddress ? _e : ""}</section>`;
}
const De = "https://conet.fm", Pe = "https://sepolia.basescan.org";
class Ue extends HTMLElement {
  receiver;
  connectedCallback() {
    if (this.receiver) return;
    const o = this.attachShadow({ mode: "open" });
    o.innerHTML = `<style>${ze}</style><main class="receiver-embed">${Oe({ tuneByAddress: !1 })}</main>`, this.receiver = Re(o, {
      origin: (this.getAttribute("origin") ?? De).replace(/\/+$/, ""),
      explorerUrl: Pe
    });
  }
  disconnectedCallback() {
    this.receiver?.destroy(), this.receiver = void 0;
  }
}
customElements.get("conet-tuner") || customElements.define("conet-tuner", Ue);
