import { useEffect, useRef } from "react";
import * as THREE from "three";

// Adapted from the standalone `terrazzo.html` prototype. Key changes
// for the banner use case:
//   • Aspect ratio is driven by the rendered DOM box, not assumed 1:1.
//     Camera frustum and chip x-distribution scale to the parent.
//   • Single deterministic mode — no controls, no UI — `seed` drives
//     everything (palette, style, density, chip placement).
//   • `palette` and `style` are pickable from the seed, but can be
//     pinned via props for editorial control (e.g. one consistent
//     palette per publication).

const PALETTES: Record<string, string[]> = {
    Bianco: ["#f1ece1", "#1a1a1a", "#8b3a2f", "#cb6a4f", "#5a5247", "#a6a097", "#d4c8a8"],
    Mint:   ["#e8f0e6", "#2d4a3e", "#5a8c7e", "#a8c8b8", "#f4a896", "#1a1a1a", "#d9c9a8"],
    Rose:   ["#f6e6e0", "#7a3a3a", "#d9847c", "#3a2a28", "#c9a89a", "#e8c9a8", "#a06864"],
    Carbon: ["#e8e6e2", "#1a1a1a", "#3a3a3a", "#6c6c6a", "#a0a09c", "#bcbab5"],
    Tropic: ["#f4ead8", "#2d6e3e", "#f2a83b", "#d94f3e", "#1a3a4a", "#8c5a3e", "#e8d9a8"],
    Ink:    ["#1a1a1a", "#f1ece1", "#cb6a4f", "#5a8c7e", "#d4c8a8", "#7a7a7a", "#3a3a3a"],
    Rosso:  ["#efe7d6", "#a82a1f", "#1a1a1a", "#e8a878", "#5a3a2a", "#d9c9a8"],
    Acqua:  ["#e6eef0", "#0e3a4a", "#3a8ca0", "#a8d0d8", "#1a1a1a", "#d9c9a8", "#cb6a4f"],
};

interface StylePreset {
    algo: "scatter" | "palladiana";
    density: number;
    minSize: number;
    maxSize: number;
    sides: number;
    chaos: number;
    sizeBias: number;
}

const STYLES: Record<string, StylePreset> = {
    Venetian:   { algo: "scatter",    density: 220, minSize: 6, maxSize: 80,  sides: 6, chaos: 55, sizeBias: 2.2 },
    Palladiana: { algo: "palladiana", density: 110, minSize: 4, maxSize: 130, sides: 6, chaos: 35, sizeBias: 2.5 },
    Micro:      { algo: "scatter",    density: 460, minSize: 3, maxSize: 18,  sides: 6, chaos: 50, sizeBias: 1.5 },
    Shards:     { algo: "scatter",    density: 200, minSize: 5, maxSize: 90,  sides: 4, chaos: 78, sizeBias: 2.0 },
    Pebble:     { algo: "scatter",    density: 130, minSize: 8, maxSize: 60,  sides: 9, chaos: 22, sizeBias: 1.8 },
};

function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function makeChipVerts(
    cx: number,
    cy: number,
    radius: number,
    vertexCount: number,
    irr: number,
    rng: () => number,
): THREE.Vector2[] {
    const verts: THREE.Vector2[] = [];
    const step = (Math.PI * 2) / vertexCount;
    const angOffset = rng() * Math.PI * 2;
    for (let i = 0; i < vertexCount; i++) {
        const baseAng = angOffset + i * step;
        const angle = baseAng + (rng() - 0.5) * step * irr * 0.7;
        const r = radius * (1 - irr * 0.45 + rng() * irr * 0.55);
        verts.push(new THREE.Vector2(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r));
    }
    return verts;
}

function jitterColor(hex: string, rng: () => number): THREE.Color {
    const c = new THREE.Color(hex);
    const hsl = { h: 0, s: 0, l: 0 };
    c.getHSL(hsl);
    hsl.h = (hsl.h + (rng() - 0.5) * 0.025 + 1) % 1;
    hsl.s = THREE.MathUtils.clamp(hsl.s + (rng() - 0.5) * 0.10, 0, 1);
    hsl.l = THREE.MathUtils.clamp(hsl.l + (rng() - 0.5) * 0.07, 0, 1);
    c.setHSL(hsl.h, hsl.s, hsl.l);
    return c;
}

interface Props {
    /** Seed driving palette, style, chip placement. Required. */
    seed: number;
    /** Pin a specific palette name; otherwise picked deterministically. */
    palette?: keyof typeof PALETTES;
    /** Pin a specific style name; otherwise picked deterministically. */
    style?: keyof typeof STYLES;
    /** Optional className for the wrapping div. */
    className?: string;
}

export default function TerrazzoBanner({ seed, palette, style, className }: Props) {
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const wrap = wrapRef.current;
        if (!wrap) return;

        // Pick palette + style deterministically (or use pinned values).
        // Computed before the renderer so the no-WebGL fallback below
        // can use the palette's matrix color.
        const seedRng = mulberry32(seed);
        const paletteNames = Object.keys(PALETTES);
        const styleNames = Object.keys(STYLES);
        const paletteName = (palette ?? paletteNames[Math.floor(seedRng() * paletteNames.length)]) as keyof typeof PALETTES;
        const styleName = (style ?? styleNames[Math.floor(seedRng() * styleNames.length)]) as keyof typeof STYLES;
        const pal = PALETTES[paletteName];
        const stylePreset = STYLES[styleName];

        let renderer: THREE.WebGLRenderer;
        try {
            renderer = new THREE.WebGLRenderer({
                antialias: true,
                preserveDrawingBuffer: false,
            });
        } catch {
            // WebGL unavailable (software renderers, exhausted context
            // budget, headless browsers). Paint the wrap with the
            // terrazzo matrix color so the colophon keeps its visual
            // anchor instead of collapsing to an empty box.
            wrap.style.background = pal[0];
            return () => {
                wrap.style.background = "";
            };
        }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        const canvas = renderer.domElement;
        canvas.style.display = "block";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        wrap.appendChild(canvas);

        const scene = new THREE.Scene();
        // Camera frustum is rebuilt per-resize to match the parent's
        // aspect ratio. Initial values are placeholders.
        const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -10, 10);
        camera.position.z = 1;

        // ────────── chip generation ──────────
        let chipsRoot: THREE.Group | null = null;
        let lastWidth = 0;
        let lastHeight = 0;

        function disposeChips() {
            if (!chipsRoot) return;
            chipsRoot.traverse((obj) => {
                const mesh = obj as THREE.Mesh;
                if (mesh.geometry) mesh.geometry.dispose();
                const m = mesh.material;
                if (m) {
                    if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
                    else m.dispose();
                }
            });
            scene.remove(chipsRoot);
            chipsRoot = null;
        }

        function build(aspect: number) {
            disposeChips();
            chipsRoot = new THREE.Group();
            scene.add(chipsRoot);

            // Camera spans -aspect/2..aspect/2 horizontally, -0.5..0.5 vertically.
            // For aspect > 1 (wide banner), x range expands.
            camera.left = -aspect / 2;
            camera.right = aspect / 2;
            camera.top = 0.5;
            camera.bottom = -0.5;
            camera.updateProjectionMatrix();

            const matrixColor = new THREE.Color(pal[0]);
            scene.background = matrixColor.clone();

            const bg = new THREE.Mesh(
                new THREE.PlaneGeometry(aspect * 1.1, 1.1),
                new THREE.MeshBasicMaterial({ color: matrixColor }),
            );
            bg.position.z = -2;
            chipsRoot.add(bg);

            const chipPalette = pal.slice(1);
            const minSize = stylePreset.minSize / 1000;
            const maxSize = Math.max(minSize + 0.005, stylePreset.maxSize / 1000);

            const rng = mulberry32(seed);
            const xSpan = aspect; // chips distribute across full width

            const chips: Array<{
                cx: number; cy: number; r: number; n: number; irr: number;
                colorIdx: number; sub: number;
            }> = [];

            // Density scales with width since the canvas is now wider —
            // otherwise wide banners would look sparse.
            const scaledDensity = Math.round(stylePreset.density * Math.max(1, aspect * 0.6));

            if (stylePreset.algo === "palladiana") {
                const bigCount = 9 + Math.floor(rng() * 8);
                for (let i = 0; i < bigCount; i++) {
                    chips.push({
                        cx: (rng() - 0.5) * xSpan,
                        cy: (rng() - 0.5) * 1.0,
                        r: maxSize * (0.65 + rng() * 0.55),
                        n: 4 + Math.floor(rng() * 3),
                        irr: (stylePreset.chaos / 100) * 0.4,
                        colorIdx: Math.floor(rng() * chipPalette.length),
                        sub: Math.floor(rng() * 1e9),
                    });
                }
                for (let i = 0; i < scaledDensity; i++) {
                    const t = Math.pow(rng(), stylePreset.sizeBias);
                    chips.push({
                        cx: (rng() - 0.5) * xSpan * 1.05,
                        cy: (rng() - 0.5) * 1.05,
                        r: minSize + t * (maxSize * 0.25 - minSize),
                        n: Math.max(3, stylePreset.sides + Math.floor((rng() - 0.5) * 3)),
                        irr: stylePreset.chaos / 100,
                        colorIdx: Math.floor(rng() * chipPalette.length),
                        sub: Math.floor(rng() * 1e9),
                    });
                }
            } else {
                for (let i = 0; i < scaledDensity; i++) {
                    const t = Math.pow(rng(), stylePreset.sizeBias);
                    chips.push({
                        cx: (rng() - 0.5) * xSpan * 1.05,
                        cy: (rng() - 0.5) * 1.05,
                        r: minSize + t * (maxSize - minSize),
                        n: Math.max(3, stylePreset.sides + Math.floor((rng() - 0.5) * 3)),
                        irr: stylePreset.chaos / 100,
                        colorIdx: Math.floor(rng() * chipPalette.length),
                        sub: Math.floor(rng() * 1e9),
                    });
                }
            }

            chips.sort((a, b) => b.r - a.r);

            const positions: number[] = [];
            const colors: number[] = [];
            const indices: number[] = [];
            let indexOffset = 0;

            for (let i = 0; i < chips.length; i++) {
                const c = chips[i];
                const localRng = mulberry32(c.sub);
                const verts = makeChipVerts(c.cx, c.cy, c.r, c.n, c.irr, localRng);
                const shape = new THREE.Shape(verts);
                const geom = new THREE.ShapeGeometry(shape);
                const color = jitterColor(chipPalette[c.colorIdx], localRng);
                const pos = geom.attributes.position.array as Float32Array;
                const idx = geom.index ? (geom.index.array as ArrayLike<number>) : null;
                const z = -1 + (i / Math.max(1, chips.length - 1)) * 0.9;
                const vertCount = pos.length / 3;
                for (let v = 0; v < vertCount; v++) {
                    positions.push(pos[v * 3], pos[v * 3 + 1], z);
                    colors.push(color.r, color.g, color.b);
                }
                if (idx) {
                    for (let j = 0; j < idx.length; j++) indices.push(idx[j] + indexOffset);
                } else {
                    for (let j = 0; j < vertCount; j++) indices.push(j + indexOffset);
                }
                indexOffset += vertCount;
                geom.dispose();
            }

            if (positions.length > 0) {
                const merged = new THREE.BufferGeometry();
                merged.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
                merged.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
                merged.setIndex(indices);
                const chipMat = new THREE.MeshBasicMaterial({ vertexColors: true });
                chipsRoot.add(new THREE.Mesh(merged, chipMat));
            }

            // Subtle grit.
            const gritCount = 200 + Math.floor(rng() * 400);
            const gritGeom = new THREE.CircleGeometry(0.0018, 6);
            const gritColor = matrixColor.clone().multiplyScalar(0.55);
            const gritMat = new THREE.MeshBasicMaterial({ color: gritColor });
            const inst = new THREE.InstancedMesh(gritGeom, gritMat, gritCount);
            const m4 = new THREE.Matrix4();
            const pos = new THREE.Vector3();
            const scl = new THREE.Vector3();
            const quat = new THREE.Quaternion();
            for (let i = 0; i < gritCount; i++) {
                const x = (rng() - 0.5) * xSpan;
                const y = (rng() - 0.5) * 1.0;
                const s = 0.4 + rng() * 1.4;
                pos.set(x, y, 0.5);
                scl.set(s, s, 1);
                m4.compose(pos, quat, scl);
                inst.setMatrixAt(i, m4);
            }
            inst.instanceMatrix.needsUpdate = true;
            chipsRoot.add(inst);

            renderer.render(scene, camera);
        }

        // ────────── observe parent size ──────────
        const ro = new ResizeObserver(() => {
            const r = wrap.getBoundingClientRect();
            const w = Math.max(1, Math.floor(r.width));
            const h = Math.max(1, Math.floor(r.height));
            if (w === lastWidth && h === lastHeight) return;
            lastWidth = w;
            lastHeight = h;
            renderer.setSize(w, h, false);
            const aspect = w / h;
            build(aspect);
        });
        ro.observe(wrap);

        return () => {
            ro.disconnect();
            disposeChips();
            // Release the WebGL context explicitly. dispose() alone
            // doesn't always free it, and across HMR cycles the
            // contexts accumulate to the browser's per-page cap.
            renderer.forceContextLoss();
            renderer.dispose();
            if (canvas.parentElement === wrap) wrap.removeChild(canvas);
        };
    }, [seed, palette, style]);

    return (
        <div
            ref={wrapRef}
            className={className}
            style={{ width: "100%", height: "100%", display: "block", overflow: "hidden" }}
            aria-hidden="true"
        />
    );
}
