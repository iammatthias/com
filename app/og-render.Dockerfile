# The homelab's renderer of the entries' social loops (scripts/og-entries.ts). Build from app/:
#   docker build -f og-render.Dockerfile -t og-render .
# Run it with a write-scope blobs key, and BLOBS_URL for blobs as the box reaches it:
#   docker run --rm -e BLOBS_API_KEY -e BLOBS_URL=http://172.17.0.1:8789 og-render
# The GPU, when there is one to give it: --device /dev/dri/renderD128 and OG_CHROMIUM_ARGS
# (ANGLE on Vulkan, say). Without them Chromium draws in software. Each loop's log says which.
# One run draws what isn't pinned yet and stops; run it again after a publish, or on a timer.

# the card's GLSL, made from plate.wgsl as Trunk's hook makes it, so the renderer needs no naga
FROM rust:1.99.1-slim AS gen
RUN cargo install naga-cli --version 30.0.1 --locked
COPY src/plate.wgsl /w/plate.wgsl
RUN mkdir /w/gen \
    && naga /w/plate.wgsl /w/gen/vs.vert --entry-point vs_main --profile es300 --shader-stage vert \
    && naga /w/plate.wgsl /w/gen/plate.frag --entry-point fs_plate --profile es300 --shader-stage frag \
    && naga /w/plate.wgsl /w/gen/optics.frag --entry-point fs_optics --profile es300 --shader-stage frag

FROM oven/bun:1.4.4 AS bun

# Playwright's own image at the version e2e/bun.lock resolves, so its Chromium is the one the
# script drives
FROM mcr.microsoft.com/playwright:v1.64.1-noble
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg x264 \
    && rm -rf /var/lib/apt/lists/*
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
COPY e2e/package.json e2e/bun.lock e2e/
RUN cd e2e && bun install --frozen-lockfile
COPY card/card.html card/card.js card/portrait.r8 card/
COPY --from=gen /w/gen/ card/gen/
COPY assets/fonts/Inter.ttf assets/fonts/Inter-Italic.ttf assets/fonts/Newsreader.ttf assets/fonts/Newsreader-Italic.ttf assets/fonts/OFL-Inter.txt assets/fonts/OFL-Newsreader.txt assets/fonts/
# dated before the GLSL made from it, so og-loop.ts sees the card current
COPY src/plate.wgsl src/plate.wgsl
RUN touch -d 2000-01-01 src/plate.wgsl
COPY scripts/og-loop.ts scripts/og-entries.ts scripts/
RUN mkdir .og-loops && chown pwuser .og-loops
USER pwuser
CMD ["bun", "scripts/og-entries.ts", "--jobs", "2"]
