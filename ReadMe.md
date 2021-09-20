# Next Theme Starter

A sample [Next.js] project for getting started with [MDX] & [Theme UI].

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https%3A%2F%2Fgithub.com%2Flachlanjc%2Fnext-theme-starter&repository-name=next-theme-starter)

[next.js]: https://nextjs.org
[mdx]: https://mdxjs.com
[theme ui]: https://theme-ui.com

## Usage

1. Import this repo to your coding environment of choice. [Download a zip](https://github.com/lachlanjc/next-theme-starter/archive/refs/heads/main.zip), use Create Next App (`yarn create next-app -e https://github.com/lachlanjc/next-theme-starter`),  or use the GitHub import on CodeSandbox/repl.it/Glitch/etc.
2. `yarn` to install dependencies.
3. `yarn dev` to start your server.
4. Start adding your own pages & components in their respective directories.

## Configuration

### Theme switcher

There’s an included example theme switcher component at `components/color-switcher.js`,
which is included on every page through its inclusion in `pages/_app.js`.
Feel free to change/remove it.

### Custom theme

By default, a theme inspired by the [Hack Club Theme](https://theme.hackclub.com) is included.
To edit the theme, head to `lib/theme.js`.

### Running at another port

Super easy: `yarn dev -p 5000`

### Dependency updates

The included Dependabot configuration file means you’ll automatically get PRs
every Monday with dependency updates. Delete `.github/dependabot.yml` to
disable.

### Meta tags

This template includes a `Meta` component for adding full meta tags.
To set the defaults, open `components/meta.js` & change the default props.

It’s included in `pages/_app.js` so all pages have the default tags without
anything per-page, but due to the `key`s included on each tag, if you render
the component multiple times (such as once in `_app` & again on an invidual page),
the last instance of each tag will be used, with duplicates.

If you don’t set a `description` or `image`, the relevant tags for those fields
will be omitted.

Here’s how you use `Meta` on a page:

```js
import Meta from '../components/meta'

const AboutPage = () => (
  <>
    <Meta
      title="About" // page title
      description="About our nonprofit." // page description
      image="https://yourdomain.com/special-card.png" // large summary card image URL
    />
    {/* … */}
  </>
)

export default Page
```

(The default props are included on the component instead of `_app.js` so you
don’t have to re-include all the props on each page.)

You can also pass children to `Meta` to quickly include custom tags inside the
[Next.js `Head`](https://nextjs.org/docs/api-reference/next/head).

### Icons

No iconsets are included with this starter, but a few I recommend:

- [react-bootstrap-icons](https://github.com/ismamz/react-bootstrap-icons)
- [react-ionicons](https://github.com/zamarrowski/react-ionicons)
- [react-feather](https://github.com/feathericons/react-feather)
- [@geist-ui/react-icons](https://github.com/geist-org/react-icons)
- [@hackclub/icons](https://github.com/hackclub/icons)

### Adding analytics

I recommend [Fathom Analytics](https://usefathom.com/ref/NXBJA2) or
[Plausible.io](https://plausible.io)
for simple, privacy-focused analytics.

<details>
<summary>Example `_app` with Fathom (requires `fathom-client`)</summary>

```js
import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

import Meta from '../components/meta'
import theme from '../lib/theme'
import { ThemeProvider } from 'theme-ui'
import * as Fathom from 'fathom-client'

const App = ({ Component, pageProps }) => {
  const router = useRouter()

  useEffect(() => {
    Fathom.load('YOURCODE', {
      includedDomains: ['YOURDOMAIN.com'],
      url: 'https://YOURSUB.YOURDOMAIN.com/script.js', // optional
    })
    const onRouteChangeComplete = () => Fathom.trackPageview()
    router.events.on('routeChangeComplete', onRouteChangeComplete)
    return () => {
      router.events.off('routeChangeComplete', onRouteChangeComplete)
    }
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <Meta />
      <Component {...pageProps} />
    </ThemeProvider>
  )
}

export default App
```

</details>
<details>
<summary>Example `_app` with Plausible (requires `next-plausible`)</summary>

```js
import * as React from 'react'
import Head from 'next/head'

import PlausibleProvider from 'next-plausible'
import theme from '../lib/theme'
import { ThemeProvider } from 'theme-ui'
import Meta from '../components/meta'

const App = ({ Component, pageProps }) => {
  return (
    <PlausibleProvider domain="YOURDOMAIN.com">
      <ThemeProvider theme={theme}>
        <Meta />
        <Component {...pageProps} />
      </ThemeProvider>
    </PlausibleProvider>
  )
}

export default App
```

</details>

## Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/git?s=https%3A%2F%2Fgithub.com%2Flachlanjc%2Fnext-theme-starter&repo-name=next-theme-project)

I highly recommend using [Vercel](https://vercel.com) for deployment. It requires no
configuration, is totally free for personal projects, and supports all the features
of Next.js with the best performance. Refer to [their documentation](https://vercel.com/docs#deploy-an-existing-project)
for more details. 

Alternatively, you can deploy your site on [Netlify](https://netlify.com), which is also free but requires configuration (refer to [their documentation](https://docs.netlify.com/configure-builds/common-configurations/#next-js)) & doesn’t support every feature of Next.js (fallback pages & image optimization, among others).
