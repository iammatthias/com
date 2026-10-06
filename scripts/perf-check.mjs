import { execSync, spawn } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { chromium } from "playwright";

const OWNS_SERVER = !process.env.BASE_URL;
const BASE = process.env.BASE_URL ?? "http://localhost:4399";
const BUDGET_FILE = new URL("./__goldens__/perf-budget.json", import.meta.url);
const WRITE = process.argv.includes("--write");
const JSON_OUT = process.argv.includes("--json");

const PAGES = [
    "/",
    "/posts/1787249855000-on-diffusion",
    "/art/1738786576559-ocean-dreams",
    "/art/1710822761635-vsco",
    "/recipes/1602505860000-challah",
    "/feed",
    "/tags",
    "/menu",
];

const VIEWPORTS = [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 390, height: 844, cpuThrottle: 4 },
];

const COUNTERS = ["glStalls", "layouts", "styleRecalcs", "domNodes", "jsBytes", "cssBytes", "requests"];
const ALLOWANCE = {
    glStalls: (n) => n,
    layouts: (n) => n + 3,
    styleRecalcs: (n) => n + 3,
    domNodes: (n) => Math.ceil(n * 1.05),
    jsBytes: (n) => Math.ceil(n * 1.05),
    cssBytes: (n) => Math.ceil(n * 1.05),
    requests: (n) => n + 1,
};

let server = null;
if (OWNS_SERVER) {
    await new Promise((resolve) => {
        spawn("bunx", ["astro", "preview", "stop"], { stdio: "ignore" }).on("exit", resolve);
    });
    try {
        execSync("lsof -ti tcp:4399 | xargs kill", { stdio: "ignore" });
    } catch {
    }
    for (let i = 0; i < 30; i++) {
        try {
            execSync("lsof -ti tcp:4399", { stdio: "ignore" });
            await new Promise((r) => setTimeout(r, 500));
        } catch {
            break;
        }
    }
    server = spawn("bunx", ["astro", "preview", "--port", "4399"], { stdio: "ignore" });
    const deadline = Date.now() + 60_000;
    let up = false;
    while (Date.now() < deadline && !up) {
        try {
            await fetch(BASE + "/");
            up = true;
        } catch {
            await new Promise((r) => setTimeout(r, 1000));
        }
    }
    if (!up) {
        server.kill("SIGTERM");
        throw new Error(`preview server not reachable at ${BASE}`);
    }
}

const OBSERVE = () => {
    const salt = "#define SALT_" + Math.random().toString(36).slice(2) + "\n";
    const shaderSource = WebGLRenderingContext.prototype.shaderSource;
    WebGLRenderingContext.prototype.shaderSource = function (shader, source) {
        const at = source.startsWith("#extension") ? source.indexOf("\n") + 1 : 0;
        return shaderSource.call(this, shader, source.slice(0, at) + salt + source.slice(at));
    };
    window.__perf = { shifts: [], lcp: 0, frameGaps: [], glStalls: 0 };
    const gl = WebGLRenderingContext.prototype;
    const pending = (ctx, query, object) => {
        const parallel = ctx.getExtension("KHR_parallel_shader_compile");
        return !parallel || !query.call(ctx, object, parallel.COMPLETION_STATUS_KHR);
    };
    const getProgramParameter = gl.getProgramParameter;
    gl.getProgramParameter = function (program, pname) {
        if (pname === this.LINK_STATUS && pending(this, getProgramParameter, program)) {
            window.__perf.glStalls++;
        }
        return getProgramParameter.call(this, program, pname);
    };
    const getShaderParameter = gl.getShaderParameter;
    gl.getShaderParameter = function (shader, pname) {
        if (pname === this.COMPILE_STATUS && pending(this, getShaderParameter, shader)) {
            window.__perf.glStalls++;
        }
        return getShaderParameter.call(this, shader, pname);
    };
    let last = 0;
    const tick = (t) => {
        if (last) window.__perf.frameGaps.push(t - last);
        last = t;
        if (t < 3000) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
            if (e.hadRecentInput) continue;
            window.__perf.shifts.push({
                value: e.value,
                t: Math.round(e.startTime),
                sources: (e.sources ?? []).map((s) => {
                    const n = s.node;
                    if (!n || n.nodeType !== 1) return n?.nodeName ?? "?";
                    const cls = n.className && typeof n.className === "string"
                        ? "." + n.className.trim().split(/\s+/).slice(0, 2).join(".")
                        : "";
                    return n.tagName.toLowerCase() + cls;
                }),
            });
        }
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((list) => {
        const last = list.getEntries().at(-1);
        if (last) window.__perf.lcp = Math.round(last.startTime);
    }).observe({ type: "largest-contentful-paint", buffered: true });
};

function rendererLongTasks(trace) {
    const events = JSON.parse(trace.toString()).traceEvents;
    const mains = new Set(
        events
            .filter((e) => e.ph === "M" && e.name === "thread_name" && e.args?.name === "CrRendererMain")
            .map((e) => `${e.pid}:${e.tid}`),
    );
    return events
        .filter((e) => e.ph === "X" && e.name === "RunTask" && e.dur > 50_000 && mains.has(`${e.pid}:${e.tid}`))
        .map((e) => Math.round(e.dur / 1000));
}

async function profile(browser, context, path, viewport) {
    const page = await context.newPage();
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const cdp = await context.newCDPSession(page);
    await cdp.send("Performance.enable");
    if (viewport.cpuThrottle) {
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: viewport.cpuThrottle });
    }
    await page.addInitScript(OBSERVE);

    const bytes = { js: 0, css: 0, requests: 0 };
    page.on("response", async (res) => {
        const url = res.url();
        if (!url.startsWith(BASE)) return;
        bytes.requests++;
        const type = res.request().resourceType();
        if (type !== "script" && type !== "stylesheet") return;
        try {
            const len = (await res.body()).length;
            if (type === "script") bytes.js += len;
            else bytes.css += len;
        } catch {
        }
    });

    await browser.startTracing(page, {
        categories: ["devtools.timeline", "disabled-by-default-devtools.timeline"],
    });
    await page.goto(BASE + path, { waitUntil: "load" });
    await page.waitForTimeout(3000);
    const longTasks = rendererLongTasks(await browser.stopTracing());

    const metrics = Object.fromEntries(
        (await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]),
    );
    const observed = await page.evaluate(() => window.__perf);
    const domNodes = await page.evaluate(() => document.getElementsByTagName("*").length);
    await page.close();

    const cls = observed.shifts.reduce((sum, s) => sum + s.value, 0);
    return {
        layouts: metrics.LayoutCount,
        styleRecalcs: metrics.RecalcStyleCount,
        scriptMs: Math.round(metrics.ScriptDuration * 1000),
        layoutMs: Math.round(metrics.LayoutDuration * 1000),
        styleMs: Math.round(metrics.RecalcStyleDuration * 1000),
        taskMs: Math.round(metrics.TaskDuration * 1000),
        longTasks: longTasks.length,
        longTaskMs: longTasks,
        maxFrameGap: Math.round(Math.max(0, ...observed.frameGaps)),
        glStalls: observed.glStalls,
        lcp: observed.lcp,
        cls: Number(cls.toFixed(4)),
        shifts: observed.shifts,
        domNodes,
        jsBytes: bytes.js,
        cssBytes: bytes.css,
        requests: bytes.requests,
    };
}

const browser = await chromium.launch({ channel: "chromium" });
const probe = await browser.newPage();
const parallelCompile = await probe.evaluate(
    () => !!document.createElement("canvas").getContext("webgl")?.getExtension("KHR_parallel_shader_compile"),
);
await probe.close();
if (!parallelCompile) {
    await browser.close();
    server?.kill("SIGTERM");
    throw new Error("this Chromium has no KHR_parallel_shader_compile, so glStalls cannot be measured; run on a machine with a GPU");
}
const results = {};
const worst = {};
try {
    for (let pass = 0; pass < (WRITE ? 3 : 1); pass++) {
        for (const viewport of VIEWPORTS) {
            const context = await browser.newContext({ deviceScaleFactor: 1 });
            await profile(browser, context, "/menu", viewport);
            for (const path of PAGES) {
                const key = `${viewport.name} ${path}`;
                const r = await profile(browser, context, path, viewport);
                results[key] ??= r;
                worst[key] ??= {};
                for (const c of [...COUNTERS, "cls"]) {
                    worst[key][c] = Math.max(worst[key][c] ?? 0, r[c]);
                }
            }
            await context.close();
        }
    }
} finally {
    await browser.close();
    server?.kill("SIGTERM");
}

if (JSON_OUT) {
    console.log(JSON.stringify(results, null, 2));
} else {
    for (const [key, r] of Object.entries(results)) {
        console.log(
            `${key.padEnd(48)} layouts ${String(r.layouts).padStart(4)}  recalcs ${String(r.styleRecalcs).padStart(4)}  ` +
                `script ${String(r.scriptMs).padStart(4)}ms  style ${String(r.styleMs).padStart(4)}ms  layout ${String(r.layoutMs).padStart(4)}ms  ` +
                `gap ${String(r.maxFrameGap).padStart(3)}ms  gl-stalls ${r.glStalls}  cls ${r.cls.toFixed(3)}  lcp ${r.lcp}ms  dom ${r.domNodes}  js ${(r.jsBytes / 1024).toFixed(0)}K  css ${(r.cssBytes / 1024).toFixed(0)}K  req ${r.requests}` +
                (r.longTasks ? `  long [${r.longTaskMs.join(",")}]` : ""),
        );
        for (const s of r.shifts.filter((s) => s.value >= 0.001)) {
            console.log(`    shift ${s.value.toFixed(4)} @${s.t}ms ← ${s.sources.join(", ")}`);
        }
    }
}

if (WRITE) {
    writeFileSync(BUDGET_FILE, JSON.stringify(worst, null, 2) + "\n");
    console.log(`\nwrote ${BUDGET_FILE.pathname}`);
} else if (!JSON_OUT && existsSync(BUDGET_FILE)) {
    const budget = JSON.parse(readFileSync(BUDGET_FILE, "utf8"));
    let failures = 0;
    for (const [key, limits] of Object.entries(budget)) {
        const r = results[key];
        if (!r) continue;
        for (const c of COUNTERS) {
            if (r[c] > ALLOWANCE[c](limits[c])) {
                failures++;
                console.log(`FAIL ${key} ${c} ${r[c]} > ${limits[c]}`);
            }
        }
        if (r.cls > limits.cls + 0.001) {
            failures++;
            console.log(`FAIL ${key} cls ${r.cls} > ${limits.cls}`);
        }
    }
    console.log(failures ? `\n${failures} budget regressions` : "\nwithin budget");
    process.exitCode = failures ? 1 : 0;
}
