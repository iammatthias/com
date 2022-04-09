import Head from 'next/head';

function makeTitle(title: string, name: string) {
  return title === name ? title : `${title} - ${name}`;
}

export default function Meta({
  title = `I AM MATTHIAS`, // page title
  name = `I AM MATTHIAS`, // site name
  description = `A personal portfolio project in a digital garden `, // page description
  image = `https://og.iammatthias.com/${encodeURIComponent(
    title,
  )}.png?theme=dark&md=0`,
  children,
}: any) {
  return (
    <Head>
      <meta key="og_locale" property="og:locale" content="en_US" />
      <meta key="og_type" property="og:type" content="website" />
      <meta key="og_site" property="og:site_name" content={name} />
      <title key="title">{makeTitle(title, name)}</title>
      <meta
        key="og_title"
        property="og:title"
        content={makeTitle(title, name)}
      />
      <meta
        key="tw_title"
        name="twitter:title"
        content={makeTitle(title, name)}
      />
      {description && (
        <>
          <meta key="desc" name="description" content={description} />
          <meta key="og_desc" property="og:description" content={description} />
          <meta
            key="tw_desc"
            name="twitter:description"
            content={description}
          />
        </>
      )}
      {image && (
        <>
          <meta key="og_img" property="og:image" content={image} />
          <meta
            key="tw_card"
            name="twitter:card"
            content="summary_large_image"
          />
          <meta key="tw_img" name="twitter:image" content={image} />
        </>
      )}
      <meta key="tile_color" name="msapplication-TileColor" content="#131315" />
      <link rel="icon" type="image/png" href="/favicon.png"></link>
      <link key="manifest" rel="manifest" href="/manifest.json" />
      {children}
    </Head>
  );
}
