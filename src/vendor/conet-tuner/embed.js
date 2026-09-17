const Te = ':root{color-scheme:light dark;color:#232326;background:#f3f3f1}:root,:host{font-family:ui-serif,Georgia,Cambria,Times New Roman,Times,serif;--data-font: ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", monospace;--ink-muted: color-mix(in srgb, currentColor 78%, transparent);--hairline: color-mix(in srgb, currentColor 40%, transparent);--tick: color-mix(in srgb, currentColor 34%, transparent);--space-xs: .375rem;--space-s: .75rem;--space-m: 1rem;--space-l: 1.75rem;--space-xl: 3rem;--column: 38.5rem}*{box-sizing:border-box}[hidden]{display:none!important}:where(h1,h2,h3,h4,p){margin:0}body{width:100%;min-block-size:100vh;margin:0;padding:var(--space-xl) var(--space-l);line-height:1.55}body .site-header,body .definition,body .frequency-tuner,body .direct-tune,body footer{max-inline-size:var(--column)}.definition .lede{text-wrap:pretty}.definition .facts{font-family:var(--data-font);font-size:.75rem;line-height:1.7;color:var(--ink-muted);text-wrap:pretty}.definition .facts code{overflow-wrap:anywhere}.wordmark{font-size:1.75rem;font-weight:700;letter-spacing:-.02em;line-height:1}.stack,.cluster,.split{--layout-gap: var(--space-m);gap:var(--layout-gap)}.stack{display:flex;flex-direction:column;justify-content:flex-start}.cluster{display:flex;flex-wrap:wrap;align-items:center}.split{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between}.gap-xs{--layout-gap: var(--space-xs)}.gap-s{--layout-gap: var(--space-s)}.gap-l{--layout-gap: var(--space-l)}.gap-xl{--layout-gap: var(--space-xl)}main,section{min-width:0}label{display:block}button,input{font:inherit}code,button,output,summary,input[type=text],input[type=number],.frequency-tuner{font-family:var(--data-font)}button,summary,input[type=text],input[type=number]{font-size:.8125rem}a{color:inherit}.receiver label{font-family:var(--data-font);font-size:.6875rem;font-weight:400;letter-spacing:.14em;text-transform:uppercase}#frequency-readout{font-size:.8125rem;color:var(--ink-muted)}#receiver-state{font-size:.75rem;color:var(--ink-muted)}#receiver-state[data-state=ready],#receiver-state[data-state=error]{color:inherit}button,input:not([type=range]){min-block-size:2.125rem;padding:.35rem .6rem}button{flex:none;-webkit-appearance:none;appearance:none;border:1px solid var(--hairline);border-radius:0;background:transparent;color:inherit}button:enabled{cursor:pointer}:where(button,input,audio,summary):focus-visible{outline:2px solid LinkText;outline-offset:2px}summary,label{cursor:pointer}summary{color:var(--ink-muted);list-style:none}summary::-webkit-details-marker{display:none}summary:before{content:"▸";display:inline-block;width:1.2em}details[open]>summary:before{content:"▾"}details[open]>summary,summary:hover{color:inherit}input[type=text]{width:100%}.joined-control input{flex:1 1 20rem;width:auto;min-width:0}.joined-control button{align-self:stretch}.dial-window{padding-block:var(--space-xs);border-block:1px solid var(--hairline)}#frequency-dial{width:100%;-webkit-appearance:none;appearance:none;margin:0;padding:0;min-block-size:2rem;background:repeating-linear-gradient(to right,var(--tick) 0 1px,transparent 1px .625rem) center / 100% .625rem no-repeat;cursor:ew-resize;touch-action:pan-y}#frequency-dial::-webkit-slider-runnable-track{block-size:1px;background:currentColor}#frequency-dial::-webkit-slider-thumb{width:1.25rem;height:2rem;margin-top:calc(-1rem + .5px);-webkit-appearance:none;appearance:none;border:0;border-radius:0;box-shadow:none;background:linear-gradient(to right,transparent calc(50% - 1px),currentColor calc(50% - 1px),currentColor calc(50% + 1px),transparent calc(50% + 1px))}#frequency-dial::-moz-range-track{block-size:1px;background:currentColor}#frequency-dial::-moz-range-thumb{width:1.25rem;height:2rem;border:0;border-radius:0;background:linear-gradient(to right,transparent calc(50% - 1px),currentColor calc(50% - 1px),currentColor calc(50% + 1px),transparent calc(50% + 1px))}#frequency-dial:disabled{opacity:.45;cursor:not-allowed}#frequency-address{font-size:.75rem;color:var(--ink-muted)}.direct-tune label{font-size:.6875rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted)}.transport-button{min-block-size:2rem;min-inline-size:2rem;padding:.25rem .4rem;border:0;color:inherit;background:transparent}.transport-button:enabled:hover{text-decoration:underline;text-underline-offset:.2em}.transport-button:disabled{opacity:.4}.transmission-log{font-family:var(--data-font);font-size:.8125rem;line-height:1.6}.transmission-log h2{font-size:.6875rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted);font-weight:400;margin:0}#transmission-count{font-size:.6875rem;color:var(--ink-muted)}.transmission-stream{text-align:justify;-webkit-hyphens:none;hyphens:none;transition:opacity .18s ease}.transmission-log[aria-busy=true] .transmission-stream{opacity:.4}.transmission-stream .seq{font-weight:700}.transmission-stream .meta{font-style:italic;opacity:.6}[data-transmission].arrived{animation:arrive .36s ease-out}@keyframes arrive{0%{opacity:0}}@media(prefers-reduced-motion:reduce){.transmission-stream{transition:none}[data-transmission].arrived{animation:none}}code,output{overflow-wrap:anywhere}footer{padding-block-start:var(--space-m);border-block-start:1px solid var(--hairline);font-size:.875rem}footer a{color:var(--ink-muted)}.agent-handoff h2{font-family:var(--data-font);font-size:.6875rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-muted);font-weight:400;margin:0}.agent-prompt{margin:0;padding:var(--space-s);border:1px solid var(--hairline);font-size:.75rem;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere}#copy-agent-prompt{align-self:baseline;min-block-size:0;padding:0;font-family:var(--data-font);font-size:.8125rem}.skip-link:not(:focus){position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}@media(prefers-color-scheme:dark){:root{color:#e8e8e5;background:#171719}}@media(max-width:40rem){body{padding:var(--space-l) var(--space-m)}.joined-control>*{flex:1 1 100%}}.chain-link{color:inherit;text-decoration-color:color-mix(in oklab,currentColor 35%,transparent);text-underline-offset:.2em}.chain-link:hover,.chain-link:focus-visible{text-decoration-color:currentColor}.visually-hidden{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}:host{display:block}.receiver-embed{line-height:1.55}.receiver-embed .transmission-log{max-block-size:var(--conet-tuner-log-height, 28rem);overflow-y:auto;overscroll-behavior:contain}';
const Ae = /^https:\/\/[a-z0-9.-]+(?:\/[\w./-]*)?$/i;
class he extends Error {
  constructor(s) {
    super(`fragment request failed with ${s}`), this.status = s;
  }
  status;
}
function Ee(u, s) {
  const m = (e) => {
    const t = u.querySelector(`#${e}`);
    if (!t) throw new Error(`Missing #${e}`);
    return t;
  }, p = m("frequency-dial"), ve = m("frequency-marks"), I = m("frequency-readout"), T = m("frequency-address"), h = u.querySelector("#station-address") ?? void 0, oe = u.querySelector("#tune-form") ?? void 0, ae = m("receiver-state"), se = m("station-panel"), B = m("transmissions"), A = m("transmission-staging"), ye = m("transmission-log"), E = m("transmission-count"), Z = m("station-list");
  let J = s.explorerUrl, g = "", L = !1, q = 0n, v;
  const $ = /* @__PURE__ */ new Map();
  let S = !1, Q = 0, z, F, M = "", f, C = 0, V = "", y, _ = !1, O = !1, N = !1, D = !1, P, x;
  h && oe && (h.addEventListener("focus", () => h.select()), oe.addEventListener("submit", (e) => {
    e.preventDefault();
    const t = Y(h.value);
    if (!t) {
      b("Enter a valid Station address", "error"), h.focus();
      return;
    }
    R(t);
  })), p.addEventListener("input", ne), p.addEventListener("change", xe), p.addEventListener("pointerdown", () => {
    N = !0;
  });
  const ce = (e) => {
    e.persisted && (O = !1, W(), g && R(g));
  };
  window.addEventListener("pointerup", H), window.addEventListener("pointercancel", H), window.addEventListener("pagehide", re), window.addEventListener("pageshow", ce), W();
  const le = s.station ? Y(s.station) : void 0;
  return le && R(le), {
    tune: R,
    destroy() {
      re(), window.removeEventListener("pointerup", H), window.removeEventListener("pointercancel", H), window.removeEventListener("pagehide", re), window.removeEventListener("pageshow", ce);
    }
  };
  async function de(e, t) {
    const n = await fetch(`${s.origin}${e}`, { signal: t, headers: { accept: "text/html" } });
    if (!n.ok) throw new he(n.status);
    return n.text();
  }
  function R(e) {
    X(), C += 1, g = e, L = !1, q = 0n, v = void 0, M = "", f !== void 0 && window.clearTimeout(f), f = void 0, h && (h.value = e), se.hidden = !1, A.replaceChildren(), B.querySelector("[data-transmission]") ? G(!0) : j("Tuning…"), E.value = "…", b("Tuning…"), te(), me();
  }
  function be() {
    const e = U()?.station.toLowerCase();
    for (const l of Z.querySelectorAll("[data-known-frequency]")) {
      const c = Y(l.dataset.tuneStation ?? ""), a = l.dataset.stationId ?? "";
      !c || !/^[1-9]\d*$/.test(a) || $.set(c.toLowerCase(), { station: c, stationId: a });
    }
    const t = Z.querySelector("[data-station-cursor]"), n = t?.dataset.explorer;
    n && Ae.test(n) && (J = n);
    const o = t?.dataset.stationTotal;
    o && /^\d+$/.test(o) && (Q = Math.max(Q, Number(o)));
    const i = t?.dataset.stationCursor, d = t?.dataset.chainHead;
    if (i && d && /^\d+:-?\d+$/.test(i) && /^\d+$/.test(d)) {
      V = i;
      const l = BigInt(i.split(":", 1)[0]), c = BigInt(d);
      S = l > c, ee(S ? 12e3 : 0);
    } else
      ee(4e3);
    te(e);
  }
  function W() {
    if (O || _) return;
    y !== void 0 && window.clearTimeout(y), y = void 0, _ = !0, F = new AbortController();
    const e = V ? `&cursor=${encodeURIComponent(V)}` : "";
    de(`/_tuner/factory/stations?limit=1000${e}`, F.signal).then((t) => {
      Z.innerHTML = t, be();
    }).catch((t) => {
      t instanceof DOMException && t.name === "AbortError" || (I.value = "Factory signal unavailable · retrying", ee(4e3));
    }).finally(() => {
      _ = !1;
    });
  }
  function ee(e) {
    O || (y !== void 0 && window.clearTimeout(y), y = window.setTimeout(W, e));
  }
  function ue() {
    return Array.from($.values()).sort((e, t) => {
      const n = BigInt(e.stationId), o = BigInt(t.stationId);
      return n < o ? -1 : n > o ? 1 : 0;
    });
  }
  function te(e) {
    if (!S && $.size === 0) {
      p.disabled = !0, g || (I.value = "Scanning factory events…", T.textContent = "No Station selected");
      return;
    }
    if (N) {
      D = !0, P = U()?.station.toLowerCase() || e;
      return;
    }
    const t = ue(), n = e || g.toLowerCase(), o = n ? t.find((a) => a.station.toLowerCase() === n) : void 0, i = t.reduce(
      (a, w) => Math.max(a, Number(w.stationId)),
      0
    ), d = Math.max(Q, i), l = Math.ceil(t.length / 64), c = [];
    for (let a = 0; a < t.length; a += l) {
      const w = document.createElement("option");
      w.value = String(t[a].stationId), w.label = `Station ${t[a].stationId}`, c.push(w);
    }
    ve.replaceChildren(...c), p.min = "0", p.max = String(d), p.disabled = d === 0, p.value = o ? String(o.stationId) : p.value || "0", ne();
  }
  function H() {
    if (!N || (N = !1, !D)) return;
    const e = P;
    D = !1, P = void 0, x !== void 0 && window.clearTimeout(x), x = window.setTimeout(() => {
      x = void 0, te(e);
    }, 0);
  }
  function U() {
    const e = Number.parseInt(p.value, 10);
    if (!(!Number.isSafeInteger(e) || e < 1))
      return ue().find((t) => Number(t.stationId) === e);
  }
  function we(e) {
    if (!J) {
      T.textContent = e;
      return;
    }
    const t = document.createElement("a");
    t.className = "chain-link", t.href = `${J}/address/${e}`, t.target = "_blank", t.rel = "noreferrer noopener", t.textContent = e, T.replaceChildren(t);
  }
  function ne() {
    const e = U();
    if (e) {
      I.value = `Station ${e.stationId}`, we(e.station);
      return;
    }
    const t = Number.parseInt(p.value, 10);
    if (Number.isSafeInteger(t) && t >= 1 && !S) {
      I.value = `Station ${t} · not yet received`, T.textContent = "No Station selected";
      return;
    }
    I.value = $.size === 0 ? S ? "No frequencies issued" : "Scanning factory events…" : S ? "Off band" : `Off band · ${$.size} found`, T.textContent = "No Station selected";
  }
  function xe() {
    const e = U();
    if (fe(), !e) {
      ke();
      return;
    }
    h && (h.value = e.station), e.station.toLowerCase() !== g.toLowerCase() && R(e.station);
  }
  function ke() {
    C += 1, X(), f !== void 0 && window.clearTimeout(f), f = void 0, g = "", L = !1, q = 0n, v = void 0, M = "", h && (h.value = ""), se.hidden = !0, A.replaceChildren(), G(!1), E.value = "0", j("Choose a frequency or enter a Station address."), b("Not tuned"), ne();
  }
  function fe() {
    D = !1, P = void 0, x !== void 0 && window.clearTimeout(x), x = void 0;
  }
  function j(e) {
    B.textContent = e;
  }
  function qe(e, t) {
    const n = document.createElement("template");
    n.innerHTML = t;
    const o = Array.from(
      n.content.querySelectorAll("[data-transmission-cursor]")
    ).at(-1), i = o?.dataset.transmissionCursor, d = o?.dataset.chainHead;
    i && (M = i);
    const l = Array.from(n.content.querySelectorAll("[data-transmission]")).map((r) => ({ row: r, item: pe(r) })).filter((r) => r.item !== void 0).sort((r, k) => ge(r.item, k.item));
    l.length > 0 && !e.querySelector("[data-transmission]") && e.replaceChildren();
    const c = new Map(
      Array.from(e.querySelectorAll("[data-transmission]")).map((r) => [r.dataset.seq ?? "", r])
    ), a = [];
    for (const r of l) {
      const k = r.item.seq.toString();
      if (c.has(k)) continue;
      const ie = Array.from(e.querySelectorAll("[data-transmission]")).find((Ie) => BigInt(Ie.dataset.seq ?? "0") > r.item.seq);
      ie ? e.insertBefore(r.row, ie) : e.append(r.row), c.set(k, r.row), a.push(r);
    }
    for (; e.querySelectorAll("[data-transmission]").length > 80; )
      e.querySelector("[data-transmission]")?.remove();
    const w = Array.from(e.querySelectorAll("[data-transmission]")).map(pe).filter((r) => r !== void 0).sort(ge);
    if (v = w.at(-1), !L) {
      const r = i ? BigInt(i.split(":", 1)[0]) : 0n, k = d && /^\d+$/.test(d) ? BigInt(d) : void 0;
      if (!(k !== void 0 && r > k)) {
        b(`Tuning · scanned through seq ${v?.seq ?? 0n}`), K(0);
        return;
      }
      L = !0, q = v?.seq ?? 0n, Se(), b(v ? "Tuned" : "Tuned · carrier quiet", "ready"), K(4e3);
      return;
    }
    for (const r of a)
      r.item.seq > q && r.row.classList.add("arrived");
    v && v.seq > q && (q = v.seq, b("Tuned", "ready")), E.value = String(w.length), K(4e3);
  }
  function Se() {
    const e = Array.from(A.querySelectorAll("[data-transmission]"));
    e.length > 0 ? B.replaceChildren(...e) : j("Carrier quiet"), A.replaceChildren(), E.value = String(e.length), G(!1);
  }
  function G(e) {
    ye.setAttribute("aria-busy", String(e));
  }
  function Ce(e, t) {
    X();
    const n = C, o = new AbortController();
    z = o, de(e, o.signal).then((i) => {
      n === C && qe(t, i);
    }).catch((i) => {
      if (n === C && !(i instanceof DOMException && i.name === "AbortError")) {
        if (G(!1), i instanceof he && i.status === 404) {
          j("Frequency not found in this factory"), E.value = "0", b("Frequency not found in this factory", "error");
          return;
        }
        b("Carrier unavailable · retrying", "error"), K(4e3);
      }
    }).finally(() => {
      z === o && (z = void 0);
    });
  }
  function me() {
    if (!g) return;
    const e = M ? `&cursor=${encodeURIComponent(M)}` : "";
    Ce(
      `/_tuner/stations/${encodeURIComponent(g)}/transmissions?limit=80${e}`,
      L ? B : A
    );
  }
  function K(e) {
    f !== void 0 && window.clearTimeout(f), f = window.setTimeout(me, e);
  }
  function pe(e) {
    const t = Y(e.dataset.station ?? g), n = e.dataset.stationId ?? "", o = e.dataset.seq ?? "", i = Number.parseInt(e.dataset.block ?? "", 10), d = e.dataset.nonce ?? "", l = Number.parseInt(e.dataset.kind ?? "", 10), c = (e.dataset.cipher ?? "").replace(/^0x/i, ""), a = c.length / 2;
    if (!(!t || !/^[1-9]\d*$/.test(n) || !/^[1-9]\d*$/.test(o) || !Number.isSafeInteger(i) || i < 0 || !/^[0-9a-f]{16}$/.test(d) || !Number.isSafeInteger(l) || l < 0 || l > 255 || !/^[0-9a-f]+$/i.test(c) || !Number.isSafeInteger(a) || a < 1))
      return { station: t, stationId: n, seq: BigInt(o), block: i, nonce: d, kind: l, cipher: c, byteCount: a };
  }
  function re() {
    O = !0, N = !1, fe(), C += 1, X(), F?.abort(), F = void 0, _ = !1, y !== void 0 && window.clearTimeout(y), y = void 0, f !== void 0 && window.clearTimeout(f), f = void 0;
  }
  function X() {
    z?.abort(), z = void 0;
  }
  function b(e, t) {
    ae.textContent = e, ae.dataset.state = t ?? "working";
  }
}
function ge(u, s) {
  return u.seq < s.seq ? -1 : u.seq > s.seq ? 1 : 0;
}
function Y(u) {
  const s = u.trim();
  return /^0x[0-9a-f]{40}$/i.test(s) ? s : void 0;
}
const Le = `
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
            <p id="transmissions" class="transmission-stream">
                Choose a frequency or enter a Station address.
            </p>
            <div id="transmission-staging" hidden></div>
        </section>
    </div>

`, $e = `
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
function ze(u = { tuneByAddress: !0 }) {
  return `<section class="receiver stack gap-l" aria-label="Receiver">${Le}${u.tuneByAddress ? $e : ""}</section>`;
}
const Me = "https://conet.fm";
class Ne extends HTMLElement {
  receiver;
  connectedCallback() {
    if (this.receiver) return;
    const s = this.attachShadow({ mode: "open" });
    s.innerHTML = `<style>${Te}</style><main class="receiver-embed">${ze({ tuneByAddress: !1 })}</main>`, this.receiver = Ee(s, {
      origin: (this.getAttribute("origin") ?? Me).replace(/\/+$/, "")
    });
  }
  disconnectedCallback() {
    this.receiver?.destroy(), this.receiver = void 0;
  }
}
customElements.get("conet-tuner") || customElements.define("conet-tuner", Ne);
