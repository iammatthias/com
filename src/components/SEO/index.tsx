// SEO.tsx
// Language: typescript

import Head from 'next/head';

type Props = {
  title?: string;
  description?: string;
  image?: string;
};

export default function SEO({
  title = `I AM MATTHIAS`,
  description = `A personal portfolio project in a digital garden`,
  image = `https://og.iammatthias.com/${encodeURIComponent(
    title,
  )}.png?theme=dark&md=0`,
}: Props) {
  return (
    <Head>
      <meta
        name="viewport"
        content="initial-scale=1, viewport-fit=cover, width=device-width"
      />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black" />
      <meta name="theme-color" content="rgba(4, 4, 0, 1)" />

      <meta key="og_locale" property="og:locale" content="en_US" />
      <meta key="og_type" property="og:type" content="website" />
      <meta key="og_site" property="og:site_name" content={title} />
      <meta key="og_title" property="og:title" content={title} />
      <meta key="og_desc" property="og:description" content={description} />
      <meta key="og_img" property="og:image" content={image} />

      <meta key="tw_title" name="twitter:title" content={title} />
      <meta key="tw_desc" name="twitter:description" content={description} />
      <meta key="tw_card" name="twitter:card" content="summary_large_image" />
      <meta key="tw_img" name="twitter:image" content={image} />

      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/images/apple-touch-icon.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/images/favicon-32x32.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/images/favicon-16x16.png"
      />
      <link rel="mask-icon" href="/images/safari-pinned-tab.svg" />
      <link rel="shortcut icon" href="/images/favicon.ico" />
      <link key="manifest" rel="manifest" href="/manifest.json" />

      <title>{title}</title>
    </Head>
  );
}
