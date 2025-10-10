<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  
  <xsl:template match="/rss/channel">
    <html>
      <head>
        <title><xsl:value-of select="title"/> - RSS Feed</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>

        <!-- Open Graph / Social Media -->
        <meta property="og:type" content="website"/>
        <meta property="og:title" content="{title} - RSS Feed"/>
        <meta property="og:description" content="{description}"/>
        <meta property="og:image" content="{link}api/og.png"/>
        <meta property="og:url" content="{link}/rss.xml"/>

        <meta name="twitter:card" content="summary_large_image"/>
        <meta name="twitter:title" content="{title} - RSS Feed"/>
        <meta name="twitter:description" content="{description}"/>
        <meta name="twitter:image" content="{link}/api/og.png"/>

        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-size: 16px;
            padding: 1rem;
            font-family: -apple-system-ui-serif, ui-serif, "Georgia", serif;
            background-color: #0f1419;
            background-color: color(display-p3 0.06 0.08 0.1);
            color: #f1faee;
            color: color(display-p3 0.95 0.98 0.94);
            caret-color: #ffb800;
            caret-color: color(display-p3 1 0.75 0);
            line-height: 1.6;
          }

          ::selection {
            background-color: #1b4965;
            background-color: color(display-p3 0.1 0.3 0.42);
            color: #fefae0;
            color: color(display-p3 1 0.98 0.88);
          }

          ::-moz-selection {
            background-color: #1b4965;
            background-color: color(display-p3 0.1 0.3 0.42);
            color: #fefae0;
            color: color(display-p3 1 0.98 0.88);
          }
          
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
          }

          h1, h2, h3, h4, h5, h6 {
            line-height: 1.2;
            font-weight: 700;
          }

          h1 {
            font-size: 3.5em;
            margin-bottom: 0.5rem;
          }

          h2 {
            font-size: 1.5rem;
            margin: 0 0 0.5rem 0;
          }

          a {
            color: inherit;
            text-decoration: underline;
          }

          a:hover {
            opacity: 0.7;
          }

          .header {
            margin-bottom: 2rem;
          }

          .header-meta {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 2rem;
          }

          .header-meta p {
            color: #6b8ca3;
            color: color(display-p3 0.42 0.55 0.64);
            margin: 0;
            font-size: 0.9rem;
          }

          .rss-link {
            font-size: 0.85rem;
            text-decoration: none;
            color: inherit;
            border: 1px solid #ffb800;
            border: 1px solid color(display-p3 1 0.75 0);
            padding: 0.25rem 0.5rem;
            font-family: ui-monospace, SFMono-Regular, ui-monospace, Monaco, "Andale Mono", "Ubuntu Mono", monospace;
          }

          .rss-link:hover {
            background: #1a1d23;
            background: color(display-p3 0.1 0.11 0.14);
            opacity: 1;
          }
          
          .items {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }

          .item {
            border: 1px solid #ffb800;
            border: 1px solid color(display-p3 1 0.75 0);
            padding: 1.5rem;
          }

          .item h2 a {
            text-decoration: none;
          }

          .item h2 a:hover {
            text-decoration: underline;
          }

          .item-meta {
            font-family: ui-monospace, SFMono-Regular, ui-monospace, Monaco, "Andale Mono", "Ubuntu Mono", monospace;
            font-size: 0.9rem;
            color: #6b8ca3;
            color: color(display-p3 0.42 0.55 0.64);
            margin-bottom: 1rem;
          }

          .item-description {
            line-height: 1.6;
          }

          .footer {
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 1px solid #ffb800;
            border-top: 1px solid color(display-p3 1 0.75 0);
            display: flex;
            flex-wrap: wrap;
            gap: 0;
          }

          .footer > * {
            border-right: 1px solid #ffb800;
            border-right: 1px solid color(display-p3 1 0.75 0);
            padding: 0.25rem 0.5rem;
            font-size: 0.8rem;
            font-family: ui-monospace, SFMono-Regular, ui-monospace, Monaco, "Andale Mono", "Ubuntu Mono", monospace;
          }

          code {
            font-family: ui-monospace, SFMono-Regular, ui-monospace, Monaco, "Andale Mono", "Ubuntu Mono", monospace;
            font-size: 0.9em;
            padding: 0.2rem 0.4rem;
            background: #1a1d23;
            background: color(display-p3 0.1 0.11 0.14);
          }
          
          @media (max-width: 640px) {
            body {
              padding: 0.5rem;
            }
            
            .header h1 {
              font-size: 2.5em;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1><xsl:value-of select="title"/></h1>
            <div class="header-meta">
              <p><xsl:value-of select="description"/></p>
              <a href="{link}" class="rss-link">View Site →</a>
            </div>
          </div>

          <div class="items">
            <xsl:apply-templates select="item"/>
          </div>

          <div class="footer">
            <p>Last Updated: <xsl:value-of select="lastBuildDate"/></p>
            <p>Subscribe by copying the URL into your RSS reader</p>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
  
  <xsl:template match="item">
    <article class="item">
      <h2>
        <a href="{link}">
          <xsl:value-of select="title"/>
        </a>
      </h2>
      <div class="item-meta">
        <xsl:value-of select="pubDate"/>
      </div>
      <div class="item-description">
        <xsl:value-of select="description"/>
      </div>
    </article>
  </xsl:template>
  
</xsl:stylesheet>