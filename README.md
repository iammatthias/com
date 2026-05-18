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

This is the latest version of my site — a 2026 typographic refresh built on [Astro](https://astro.build/) and deployed to [Cloudflare](https://www.cloudflare.com/) Workers. Content is authored on [Farfield](https://farfield.systems/) and pulled live at request time, so new posts surface without a rebuild.

> The code is provided as-is, and I'm not planning to provide support for this setup. Feel free to use it as inspiration for your own projects.

### built with

- [Astro](https://astro.build/) (SSR via [@astrojs/cloudflare](https://docs.astro.build/en/guides/integrations-guide/cloudflare/) + Live Content Collections)
- [Farfield](https://farfield.systems/) for content + feed + blob storage
- [Cloudflare Workers](https://workers.cloudflare.com/) for hosting and edge cache
- [wsrv.nl](https://wsrv.nl/) for on-the-fly image transforms
- [Pinata](https://pinata.cloud/) for IPFS pinning, where used
- A small [`worker-og`](./worker-og) submodule that renders Open Graph images on the edge

### the older site

The previous incarnation of this site — Obsidian-authored, Vercel-hosted — lives on the [`v2025`](https://github.com/iammatthias/com/tree/v2025) branch.
