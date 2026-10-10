export interface SeriesMedia<M> {
    cid: string;
    alt: string;
    meta: M;
}

export type Capture<M> =
    | { kind: "still"; still: SeriesMedia<M> }
    | { kind: "live"; still: SeriesMedia<M>; movie: SeriesMedia<M> }
    | { kind: "video"; movie: SeriesMedia<M> };

export function groupCaptures<M>(
    media: SeriesMedia<M>[],
    isVideo: (meta: M) => boolean,
): Capture<M>[] {
    const out: Capture<M>[] = [];
    for (let i = 0; i < media.length; i++) {
        const item = media[i];
        if (isVideo(item.meta)) {
            out.push({ kind: "video", movie: item });
            continue;
        }
        const next = media[i + 1];
        if (next && isVideo(next.meta)) {
            out.push({ kind: "live", still: item, movie: next });
            i++;
        } else {
            out.push({ kind: "still", still: item });
        }
    }
    return out;
}
