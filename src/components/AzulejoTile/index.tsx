import { useEffect, useRef } from "react";
import * as THREE from "three";
import { vertSrc, fragSrc } from "./shader";
import {
    palettes,
    CENTERS,
    WRAPPERS,
    CORNERS,
    FIELDS,
    FRAMES,
    SHADER_EDGES,
    SHADER_STRAPS,
    SHADER_GROUNDS,
    mulberry32,
    generateRecipe,
    pickColorMode,
    applyColorMode,
    pickGroutColor,
} from "./recipe";

interface Props {
    /**
     * Integer seed driving every random decision (palette, recipe,
     * grout color, imperfections). Two tiles with the same seed render
     * identically. If omitted, defaults to the millisecond timestamp at
     * mount time so each page load gets a fresh tile.
     */
    seed?: number;
    /** Rendered side length in CSS pixels. Defaults to 32 (header use). */
    size?: number;
    /**
     * 0 = no mutations (purest), 1 = default rate, 2 = double. Mutations
     * merge a second motif into the primary slot for varied output.
     */
    wildness?: number;
    /** Optional className passed to the root canvas wrapper. */
    className?: string;
    /** Optional accessible label. Defaults to "" (decorative). */
    alt?: string;
}

export default function AzulejoTile({
    seed,
    size = 32,
    wildness = 1.0,
    className,
    alt = "",
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Seed at mount time when not provided. Building this inside the
        // effect (not in render) avoids hydration mismatches and keeps
        // the seed stable for the lifetime of this mount.
        const effectiveSeed = seed ?? Date.now();

        // ---------- THREE setup ----------
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
            premultipliedAlpha: false,
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);

        const canvas = renderer.domElement;
        canvas.style.display = "block";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        if (alt) canvas.setAttribute("aria-label", alt);
        else canvas.setAttribute("aria-hidden", "true");
        canvas.setAttribute("role", "img");
        container.appendChild(canvas);

        const scene = new THREE.Scene();
        const camera = new THREE.Camera();
        const geom = new THREE.PlaneGeometry(2, 2);

        const material = new THREE.ShaderMaterial({
            vertexShader: vertSrc,
            fragmentShader: fragSrc,
            transparent: true,
            uniforms: {
                uCenter:   { value: 3 },  uWrapper: { value: 0 }, uCorners: { value: 0 },
                uEdges:    { value: 0 },  uField:   { value: 0 }, uFrame:   { value: 2 },
                uStraps:   { value: 0 },  uGround:  { value: 0 },
                uCenter2:  { value: -1 }, uWrapper2:{ value: -1}, uCornersB:{ value: -1 },
                uV1:       { value: 0.5 }, uV2:      { value: 0.5 },
                uImp:      { value: 0.65 },
                uIperf:    { value: new THREE.Vector2() },
                uBg:       { value: new THREE.Color() },
                uOl:       { value: new THREE.Color() },
                uC1:       { value: new THREE.Color() },
                uC2:       { value: new THREE.Color() },
                uC3:       { value: new THREE.Color() },
                uGrout:    { value: new THREE.Color() },
                uRes:      { value: new THREE.Vector2(size, size) },
            },
            // (An `extensions: { derivatives: true }` option used to sit
            // here for the shader's fwidth() calls — removed: derivatives
            // are core in WebGL2 and three dropped the option entirely.)
        });
        scene.add(new THREE.Mesh(geom, material));

        // ---------- compute the recipe deterministically from seed ----------
        const rng = mulberry32(effectiveSeed);
        rng(); rng(); // burn — mulberry32's first samples correlate with seed
        const paletteIdx = Math.floor(rng() * palettes.length);
        const colorMode = pickColorMode(rng);
        const recipe = generateRecipe(rng, wildness);
        rng(); // burn — was brushAngle, a shader input that no longer
        // exists; the draw stays so iperf/grout keep their values.
        const iperf: [number, number] = [rng() * 1000, rng() * 1000];
        const impJitter = 0.75 + rng() * 0.50;
        const groutCol = pickGroutColor(palettes[paletteIdx], rng);
        // The painter grabs the wrong pot now and then — a rare seeded
        // swap of the primary fill and accent colors, so two tiles with
        // the same recipe can still be individuals. Drawn last so it
        // never re-deals the draws above.
        const potSwap = rng() < 0.05;

        const pal = palettes[paletteIdx];
        let eff = applyColorMode(pal, colorMode);
        if (recipe.mut && recipe.mut.paletteMix > 0.5) {
            const otherIdx = (paletteIdx + 1 + (effectiveSeed % (palettes.length - 1))) % palettes.length;
            eff = { ...eff, c2: [...palettes[otherIdx].c1] as [number, number, number] };
        }
        if (potSwap) {
            eff = { ...eff, c1: eff.c3, c3: eff.c1 };
        }

        // ---------- bind uniforms ----------
        const u = material.uniforms;
        u.uCenter.value   = CENTERS.indexOf(recipe.center as never);
        u.uWrapper.value  = WRAPPERS.indexOf(recipe.wrapper as never);
        u.uCorners.value  = CORNERS.indexOf(recipe.corners as never);
        u.uCenter2.value  = recipe.mut.center2  ? CENTERS.indexOf(recipe.mut.center2 as never)   : -1;
        u.uWrapper2.value = recipe.mut.wrapper2 ? WRAPPERS.indexOf(recipe.mut.wrapper2 as never) : -1;
        u.uCornersB.value = recipe.mut.cornersB ? CORNERS.indexOf(recipe.mut.cornersB as never)  : -1;
        u.uEdges.value    = SHADER_EDGES.indexOf(recipe.edges as never);
        u.uField.value    = FIELDS.indexOf(recipe.field as never);
        u.uStraps.value   = SHADER_STRAPS.indexOf(recipe.straps as never);
        u.uGround.value   = SHADER_GROUNDS.indexOf(recipe.ground as never);
        u.uFrame.value    = FRAMES.indexOf(recipe.frame as never);
        u.uV1.value = recipe.v1;
        u.uV2.value = recipe.v2;
        u.uImp.value = Math.max(0, Math.min(1, 0.65 * impJitter));
        u.uIperf.value.set(iperf[0], iperf[1]);
        u.uBg.value.fromArray(eff.bg);
        u.uOl.value.fromArray(eff.ol);
        u.uC1.value.fromArray(eff.c1);
        u.uC2.value.fromArray(eff.c2);
        u.uC3.value.fromArray(eff.c3);
        u.uGrout.value.fromArray(groutCol);

        // ---------- size + render ----------
        const resize = () => {
            const wrap = container.parentElement;
            const measured = wrap
                ? Math.max(1, Math.floor(Math.min(wrap.clientWidth, wrap.clientHeight)))
                : size;
            const dim = size > 0 ? size : measured;
            renderer.setSize(dim, dim, false);
            const px = dim * Math.min(window.devicePixelRatio, 2);
            u.uRes.value.set(px, px);
            renderer.render(scene, camera);
        };

        resize();

        // ---------- cleanup ----------
        // `dispose()` releases shaders/buffers but doesn't drop the
        // underlying WebGL context. Across HMR cycles the contexts
        // accumulate and eventually hit the browser's per-page cap
        // (~16 in Chrome), at which point new instances silently fail
        // and React state downstream looks "stuck" until a hard reload.
        // `forceContextLoss()` releases the context immediately.
        return () => {
            renderer.forceContextLoss();
            renderer.dispose();
            geom.dispose();
            material.dispose();
            if (canvas.parentElement === container) {
                container.removeChild(canvas);
            }
        };
    }, [seed, size, wildness, alt]);

    return (
        <div
            ref={containerRef}
            className={className}
            style={{ width: size, height: size, display: "inline-block", lineHeight: 0 }}
        />
    );
}
