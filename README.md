```

`7MMF'
  MM
  MM       ,6"Yb.  `7MMpMMMb.pMMMb.
  MM      8)   MM    MM    MM    MM
  MM       ,pm9MM    MM    MM    MM
  MM      8M   MM    MM    MM    MM
.JMML.    `Moo9^Yo..JMML  JMML  JMML.



                                       ,,          ,,
`7MMM.     ,MMF'         mm     mm   `7MM          db
  MMMb    dPMM           MM     MM     MM
  M YM   ,M MM   ,6"Yb.mmMMmm mmMMmm   MMpMMMb.  `7MM   ,6"Yb.  ,pP"Ybd
  M  Mb  M' MM  8)   MM  MM     MM     MM    MM    MM  8)   MM  8I   `"
  M  YM.P'  MM   ,pm9MM  MM     MM     MM    MM    MM   ,pm9MM  `YMMMa.
  M  `YM'   MM  8M   MM  MM     MM     MM    MM    MM  8M   MM  L.   I8
.JML. `'  .JMML.`Moo9^Yo.`Mbmo  `Mbmo.JMML  JMML..JMML.`Moo9^Yo.M9mmmP'

```

### hi

This is the latest version of my site: a typographic, engraved-plate rebuild drawn in the browser with [GPUI](https://github.com/gpui-ce/gpui-ce) (Rust, compiled to WebAssembly on WebGPU) and served by a [Cloudflare](https://www.cloudflare.com/) Worker. Content is authored on [Farfield](https://farfield.systems/); the Worker renders each page's HTML for readers and crawlers without the app, and a publish purges what changed.

> The code is provided as-is, and I'm not planning to provide support for this setup. Feel free to use it as inspiration for your own projects.

### built with

- [GPUI](https://github.com/gpui-ce/gpui-ce) and [Trunk](https://trunkrs.dev/) for the app in [`app`](./app)
- [Cloudflare Workers](https://workers.cloudflare.com/) for hosting, server-rendered pages and edge cache, in [`worker`](./worker)
- [Farfield](https://farfield.systems/) for content, feed and blob storage
- [wsrv.nl](https://wsrv.nl/) for on-the-fly image transforms
- A small [`og`](./og) Worker that draws Open Graph cards with Browser Run

### the older sites

The Astro version this replaced lives on the [`v202610`](https://github.com/iammatthias/com/tree/v202610) branch. The one before it, Obsidian-authored and Vercel-hosted, lives on [`v2025`](https://github.com/iammatthias/com/tree/v2025).
