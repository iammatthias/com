const MAX_PLAYING = 2;
const IN_VIEW_RATIO = 0.6;

type Tile = { figure: HTMLElement; video: HTMLVideoElement };

function stillOnly(): boolean {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData =
        (navigator as Navigator & { connection?: { saveData?: boolean } })
            .connection?.saveData === true;
    return reduced || saveData;
}

function play({ video }: Tile): void {
    if (!video.getAttribute("src") && video.dataset.src) {
        video.src = video.dataset.src;
    }
    video.muted = true;
    video.play().catch(() => {});
}

function stop({ figure, video }: Tile): void {
    video.pause();
    if (video.getAttribute("src")) video.currentTime = 0;
    figure.classList.remove("is-playing");
}

function wire(tile: Tile): void {
    tile.video.addEventListener("playing", () => tile.figure.classList.add("is-playing"));
    tile.video.addEventListener("pause", () => tile.figure.classList.remove("is-playing"));
}

function onHover(tiles: Tile[]): void {
    for (const tile of tiles) {
        tile.figure.addEventListener("mouseenter", () => play(tile));
        tile.figure.addEventListener("mouseleave", () => stop(tile));
    }
}

function onScroll(tiles: Tile[]): void {
    const ratios = new Map<Element, number>();
    const byFigure = new Map(tiles.map((t) => [t.figure as Element, t]));
    const observer = new IntersectionObserver(
        (entries) => {
            for (const e of entries) ratios.set(e.target, e.intersectionRatio);
            const wanted = new Set(
                [...ratios]
                    .filter(([, r]) => r >= IN_VIEW_RATIO)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, MAX_PLAYING)
                    .map(([el]) => el),
            );
            for (const [el, tile] of byFigure) {
                if (wanted.has(el)) {
                    if (tile.video.paused) play(tile);
                } else if (!tile.video.paused) {
                    stop(tile);
                }
            }
        },
        { threshold: [0, IN_VIEW_RATIO, 1] },
    );
    for (const tile of tiles) observer.observe(tile.figure);
}

export function mountLiveTiles(root: ParentNode = document): void {
    if (stillOnly()) return;
    const tiles: Tile[] = [];
    for (const figure of root.querySelectorAll<HTMLElement>(".series-tile--live")) {
        const video = figure.querySelector<HTMLVideoElement>("video.series-tile__motion");
        if (video) tiles.push({ figure, video });
    }
    if (tiles.length === 0) return;
    tiles.forEach(wire);
    if (matchMedia("(hover: hover) and (pointer: fine)").matches) onHover(tiles);
    else onScroll(tiles);
}

mountLiveTiles();
