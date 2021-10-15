/** @jsxImportSource theme-ui */
import { useRef } from 'react'
import { gql } from '@apollo/client'
import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote } from 'next-mdx-remote'
import client from '../lib/utils/apolloClient'
import { Box } from 'theme-ui'
import useReadingTime from 'use-reading-time'
import PageHeader from '../components/pageHeader'
import PageFooter from '../components/pageFooter'

export default function Home({
  source,
  pageType,
  pageTitle,
  publishDate,
  slug,
}) {
  const post = useRef()
  const { readingTime, wordsCount } = () =>
    pageType == 'Blog' ? useReadingTime(post) : '0'

  return (
    <Box
      sx={{
        backgroundImage: theme =>
          `linear-gradient(to bottom, ${theme.colors.background}, ${theme.colors.backgroundTint})`,
        borderRadius: '4px',
        gridArea: 'body',
        position: 'relative',
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '50%',
          zIndex: '-10',
          boxShadow: 'frame',
        },
      }}
    >
      {pageType == 'Blog' || pageType == 'Gallery' ? (
        <PageHeader
          pageTitle={pageTitle}
          publishDate={publishDate}
          readingTime={readingTime}
          wordsCount={wordsCount}
          slug={slug}
        />
      ) : null}
      <Box sx={{ p: [3, 3, 4] }}>
        <article
          ref={post}
          sx={{
            'p, h1, h2, h3, h4, h5, h6, small, blockquote, ul, pre, #squiggleContainer':
              {
                maxWidth: pageType == 'Blog' ? ['100%', '', '61.8%'] : '100%',
                mx: 'auto',
              },
          }}
        >
          <MDXRemote {...source} />
        </article>
      </Box>
      {pageType == 'Blog' || pageType == 'Gallery' ? (
        <PageFooter type={pageType} slug={slug} />
      ) : null}
    </Box>
  )
}

//////////////// PAGE PATHS /////////////////////

// We use getStaticPaths to get all the slugs at build time
export async function getStaticPaths() {
  // We define our query here
  const { data } = await client.query({
    query: gql`
      query SlugsIndex($slug: String) {
        pageCollection(where: { slug: $slug, slug_not: "home" }) {
          items {
            slug
          }
        }
      }
    `,
  })
  // Get the paths we want to pre-render based on posts
  const slugs = data.pageCollection.items

  // Map them under the accepted format for the return part of getStaticPaths
  const paths = slugs.map(page => ({
    params: {
      slug: page.slug.includes('/') ? page.slug.split('/') : [page.slug],
      page: page++,
    },
  }))

  // We'll pre-render only these paths at build time.
  // { fallback: false } means other routes should 404.
  return {
    paths,
    fallback: false,
  }
}

//////////////// PAGE CONTENT /////////////////////

// We use getStaticProps to get the content at build time
export async function getStaticProps({ params }) {
  // params contains the page 'slug'.
  // We define our query here
  const { data } = await client.query({
    query: gql`
      query ($slug: String) {
        pageCollection(limit: 1, where: { slug: $slug, slug_not: "home" }) {
          items {
            title
            publishDate
            body
            slug
            pageType
          }
        }
      }
    `,
    variables: {
      slug: params.slug.join('/'),
    },
  })

  const source = data.pageCollection.items[0].body
  const mdxSource = await serialize(source)
  const pageType = data.pageCollection.items[0].pageType
  const pageTitle = data.pageCollection.items[0].title
  const publishDate = new Date(
    data.pageCollection.items[0].publishDate,
  ).toLocaleDateString('en-us')
  const slug = data.pageCollection.items[0].slug

  // We return the result of the query as props to pass them above
  return {
    props: {
      metadata: data.pageCollection.items[0],
      pageType: pageType,
      pageTitle: pageTitle,
      publishDate: publishDate,
      source: mdxSource,
      slug: slug,
    },
  }
}
