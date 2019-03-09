import React from 'react'
import Helmet from 'react-helmet'

const defaultTitle = 'I AM MATTHIAS'
const defaultDescription =
  'Photographer and digital marketing expert based in Santa Monica, California'
const defaultImage = 'https://iammatthias.com/share/shareIndex.jpg'

const SEO = props => (
  <Helmet>
    <title>
      {props.title ? `${props.title} - ${defaultTitle}` : defaultTitle}
    </title>
    <meta
      name="description"
      content={props.description ? props.description : defaultDescription}
    />
    <meta property="og:locale" content="en_US" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content={defaultTitle} />
    <meta
      property="og:title"
      content={props.title ? `${props.title} - ${defaultTitle}` : defaultTitle}
    />
    <meta
      property="og:description"
      content={props.description ? props.description : defaultDescription}
    />
    {typeof window !== `undefined` && (
      <meta property="og:url" content={location.href} />
    )}
    {props.image ? (
      <meta
        property="og:image"
        content={props.image ? `https:${props.image.ogimg.src}` : defaultImage}
      />
    ) : null}
    {props.image ? (
      <meta property="og:image:width" content={props.image.ogimg.width} />
    ) : null}
    {props.image ? (
      <meta property="og:image:height" content={props.image.ogimg.height} />
    ) : null}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:creator" content="@iammatthias" />
    <meta
      name="twitter:title"
      content={props.title ? `${props.title} - ${defaultTitle}` : defaultTitle}
    />
    <meta
      name="twitter:description"
      content={props.description ? props.description : defaultDescription}
    />
    {props.image ? (
      <meta
        name="twitter:image"
        content={props.image ? `https:${props.image.ogimg.src}` : defaultImage}
      />
    ) : null}
  </Helmet>
)

export default SEO
