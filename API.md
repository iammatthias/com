# Farfield API

Farfield is the content backend for `iammatthias.com` — it replaces the
atproto PDS as the site's data source. Three independent HTTP services, all
read-only for the website (writes need a bearer token the site does not have):

| Service | Base URL                       | Holds                          |
|---------|--------------------------------|--------------------------------|
| content | `https://content.farfield.systems` | posts, open-source, recipes, art, melange, media, series |
| feed    | `https://feed.farfield.systems`    | feed (short posts)             |
| blobs   | `https://blobs.farfield.systems`   | image bytes + metadata         |

All responses are JSON unless noted. No auth, no API key for reads.

## Records API (content + feed)

Both services run the same engine; only their collections differ.

### `GET /status`
`{ "service", "ok": true, "cursor": <int>, "collections": [...] }` — `cursor`
is the current global sequence number.

### `GET /records/{collection}`
Lists every record in a collection.

```json
{ "records": [ { "collection", "rkey", "cid", "value": {...} }, ... ],
  "cursor": 624 }
```

Sends an `ETag` for the whole list — send it back as `If-None-Match` to get a
`304`.

### `GET /records/{collection}?since={seq}`
Incremental sync: only records changed after sequence `{seq}`.

```json
{ "records": [...], "deletions": [ {"collection","rkey"}, ... ], "cursor": 700 }
```

Poll with the previous `cursor` to pull just what changed.

### `GET /records/{collection}/{rkey}`
One record: `{ "collection", "rkey", "cid", "value": {...} }`. The `ETag` is
the record's `cid` (a content hash) — stable until the record changes, so it
is safe as a cache key and for `If-None-Match`.

`404` if absent.

### `GET /schemas` · `GET /schemas/{collection}`
The lexicon-lite schemas — field names, types, which are required.

## Collections & record shapes

`value` is the record body. Field types: `datetime` is an RFC3339 UTC string.

### Content entries — `posts`, `open-source`, `recipes`, `art`, `melange`
All five share the `entry` shape. `rkey` == `slug`.

| field      | type            | notes                                  |
|------------|-----------------|----------------------------------------|
| `title`    | string          |                                        |
| `slug`     | string          | `<timestamp>-<words>`, also the rkey    |
| `published`| boolean         | drafts are `false` — filter these out  |
| `created`  | datetime        |                                        |
| `updated`  | datetime        |                                        |
| `tags`     | string[]        |                                        |
| `excerpt`  | string          | optional                               |
| `body`     | string          | markdown — see "Body URIs" below       |

### `media`
One record per image. `rkey` == the blob `cid`.

`cid`, `mime`, `width` (int), `height` (int), `blurhash`, `dominantColor`
(hex, e.g. `#3a2f1c`), `alt` (optional), `created`.

Use this to render an image with a blur-up placeholder and correct
aspect-ratio box before the bytes load.

### `series`
A gallery — an ordered group of media. `rkey` is a content hash of its refs.

`title` (optional — e.g. "Generation 1"), `description` (optional),
`refs` (string[] of media `cid`s, in display order), `created`.

### `feed`
Short posts (currently empty). `body` (markdown), `created`, `link`
(optional), `tags` (optional). Provisional shape.

## Body URIs

Markdown bodies contain two custom URI schemes the renderer must resolve:

- **`![](blob://<cid>)`** — a single image. Render `<cid>` as
  `https://blobs.farfield.systems/blobs/<cid>`. For dimensions / blurhash /
  dominant color, read the `media` record: `GET /records/media/<cid>`.

- **`![](series://<rkey>)`** — a gallery. Fetch
  `GET /records/series/<rkey>`; render `value.refs` (media cids, in order) as
  a gallery — each ref is a `blob://` image, look up its `media` record the
  same way.

No `ipfs://` URIs remain — every image was migrated onto blobs.

## Blob service (`blobs.farfield.systems`)

- **`GET /blobs/{cid}`** — the raw image bytes. Sets `Content-Type` and
  `Cache-Control: public, max-age=31536000, immutable` — content-addressed,
  so the bytes for a cid never change; cache them forever.
- **`GET /blobs/{cid}/meta`** — `{ cid, size, mime, width, height, blurhash,
  dominantColor }`.
- **`GET /blobs`** — `{ "blobs": [cid, ...] }`.

## Migrating the site off the PDS

1. Replace PDS record reads with `GET /records/{collection}` /
   `GET /records/{collection}/{rkey}` against `content.farfield.systems`
   (and `feed.farfield.systems` for the feed).
2. Filter content entries by `published === true`.
3. Render markdown bodies, resolving `blob://` and `series://` as above.
4. Drop any IPFS gateway logic — images are served by the blob service.
5. Use the record `cid` (the `ETag`) as the cache key; optionally poll
   `?since={cursor}` for incremental rebuilds.
