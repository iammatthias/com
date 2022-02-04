import Head from 'next/head'

const makeTitle = (title: string, name: string) =>
  title === name ? title : `${title} - ${name}`

const Meta = ({
  title = 'I AM MATTHIAS', // page title
  name = 'I AM MATTHIAS', // site name
  description = 'A personal portfolio project in a digital garden ', // page description
  image = 'https://og.iammatthias.com/' +
    encodeURIComponent(name == 'Home' ? 'I AM MATTHIAS' : name) +
    '.png?theme=dark&md=0', // social card image URL
  url = './',
  children,
}: any) => (
  <Head>
    <meta key="og_locale" property="og:locale" content="en_US" />
    <meta key="og_type" property="og:type" content="website" />
    <meta key="og_site" property="og:site_name" content={name} />
    <title key="title">{makeTitle(title, name)}</title>
    <meta key="og_title" property="og:title" content={makeTitle(title, name)} />
    <meta
      key="tw_title"
      name="twitter:title"
      content={makeTitle(title, name)}
    />
    {description && (
      <>
        <meta key="desc" name="description" content={description} />
        <meta key="og_desc" property="og:description" content={description} />
        <meta key="tw_desc" name="twitter:description" content={description} />
      </>
    )}
    {image && (
      <>
        <meta key="og_img" property="og:image" content={image} />
        <meta key="tw_card" name="twitter:card" content="summary_large_image" />
        <meta key="tw_img" name="twitter:image" content={image} />
      </>
    )}
    <meta key="theme_color" name="theme-color" content="#000000" />
    <meta key="tile_color" name="msapplication-TileColor" content="#000000" />

    <link key="manifest" rel="manifest" href={`${url}/site.webmanifest`} />
    {children}
  </Head>
)

export default Meta
