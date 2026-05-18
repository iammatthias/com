<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/rss/channel">
    <html lang="en">
      <head>
        <title><xsl:value-of select="title"/> — RSS</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>

        <!-- Open Graph / social -->
        <meta property="og:type" content="website"/>
        <meta property="og:title" content="{title} — RSS"/>
        <meta property="og:description" content="{description}"/>
        <meta property="og:url" content="{link}/rss.xml"/>

        <!-- Match the site's serif headings (Metamorphous) — fetched
             from Google Fonts since the XSL is parsed standalone and
             can't see Astro's bundled @fontsource asset. -->
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Metamorphous&amp;display=swap" rel="stylesheet"/>

        <style>
          :root {
            color-scheme: light dark;
            --font-sans:
                ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
                "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            --font-serif:
                Metamorphous, ui-serif, Georgia, Cambria, "Times New Roman",
                Times, serif;
            --font-mono:
                ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas,
                "Liberation Mono", monospace;

            --color-bg: light-dark(#f1ebdc, #1c1a16);
            --color-fg: light-dark(#1c1a16, #ece6da);
            --color-muted: light-dark(#7a7368, #8a8278);
            --color-border: light-dark(#e6dfd1, #2e2a23);
          }

          @supports not (color: light-dark(red, blue)) {
            @media (prefers-color-scheme: dark) {
              :root {
                --color-bg: #1c1a16;
                --color-fg: #ece6da;
                --color-muted: #8a8278;
                --color-border: #2e2a23;
              }
            }
          }

          *,
          *::before,
          *::after {
            box-sizing: border-box;
          }

          html {
            -webkit-text-size-adjust: 100%;
            text-rendering: optimizeLegibility;
          }

          body {
            margin: 0;
            padding: 0;
            font-family: var(--font-sans);
            font-size: 1rem;
            line-height: 1.5;
            color: var(--color-fg);
            background: var(--color-bg);
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          a {
            color: inherit;
            text-decoration: underline;
            text-decoration-thickness: 1px;
            text-underline-offset: 0.15em;
          }

          a:hover {
            text-decoration-thickness: 2px;
          }

          .container {
            max-width: 720px;
            margin: 0 auto;
            padding: 2rem 1rem 4rem;
          }

          .header {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            margin-bottom: 3rem;
          }

          .header h1 {
            margin: 0;
            font-family: var(--font-serif);
            font-weight: 400;
            font-size: clamp(1.875rem, 6vw, 2.25rem);
            line-height: 1.05;
            letter-spacing: -0.015em;
            text-wrap: balance;
          }

          .header p.description {
            margin: 0;
            color: var(--color-muted);
            line-height: 1.7;
            text-wrap: pretty;
          }

          .header .meta {
            font-family: var(--font-serif);
            font-style: italic;
            font-size: 0.875rem;
            color: var(--color-muted);
            display: flex;
            flex-wrap: wrap;
            align-items: baseline;
            gap: 0.5rem;
          }

          .header .meta a {
            text-decoration: none;
            color: inherit;
          }

          .header .meta a:hover {
            color: var(--color-fg);
            text-decoration: underline;
          }

          .items {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 3rem;
          }

          .item {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            padding-top: 1.5rem;
            border-top: 1px solid var(--color-border);
          }

          .item:first-child {
            padding-top: 0;
            border-top: 0;
          }

          .item h2 {
            margin: 0;
            font-family: var(--font-serif);
            font-weight: 400;
            font-size: 1.5rem;
            line-height: 1.2;
            text-wrap: balance;
          }

          .item h2 a {
            text-decoration: none;
          }

          .item h2 a:hover {
            text-decoration: underline;
            text-decoration-thickness: 1px;
            text-underline-offset: 0.15em;
          }

          .item-meta {
            font-family: var(--font-serif);
            font-style: italic;
            font-size: 0.875rem;
            color: var(--color-muted);
          }

          .item-description {
            font-size: 1rem;
            line-height: 1.7;
            color: var(--color-fg);
            text-wrap: pretty;
            /* Markdown bodies arrive as raw text via xsl:value-of;
               preserve whatever whitespace they carry without forcing
               pre formatting. */
            white-space: normal;
          }

          .footer {
            margin-top: 4rem;
            padding-top: 1.5rem;
            border-top: 1px solid var(--color-border);
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem 1rem;
            font-family: var(--font-mono);
            font-size: 0.75rem;
            color: var(--color-muted);
          }

          @media (max-width: 480px) {
            .container {
              padding: 1.5rem 1rem 3rem;
            }
          }
        </style>
      </head>
      <body>
        <main class="container">
          <header class="header">
            <h1><xsl:value-of select="title"/></h1>
            <p class="description"><xsl:value-of select="description"/></p>
            <p class="meta">
              <span>RSS feed</span>
              <span aria-hidden="true">·</span>
              <a href="{link}">visit site →</a>
            </p>
          </header>

          <ul class="items">
            <xsl:apply-templates select="item"/>
          </ul>

          <footer class="footer">
            <span>Last updated <xsl:value-of select="lastBuildDate"/></span>
            <span>Subscribe by pasting this URL into your reader</span>
          </footer>
        </main>
      </body>
    </html>
  </xsl:template>

  <xsl:template match="item">
    <li class="item">
      <h2>
        <a href="{link}">
          <xsl:value-of select="title"/>
        </a>
      </h2>
      <p class="item-meta">
        <xsl:value-of select="pubDate"/>
      </p>
      <div class="item-description">
        <xsl:value-of select="description"/>
      </div>
    </li>
  </xsl:template>
</xsl:stylesheet>
