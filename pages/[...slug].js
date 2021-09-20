/** @jsxImportSource theme-ui */
import { useRef } from 'react'
import { gql } from '@apollo/client'
import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote } from 'next-mdx-remote'
import client from '../lib/utils/apolloClient'
import { Box } from 'theme-ui'
import useReadingTime from 'use-reading-time'
import PageHeader from '../components/pageHeader'

export default function Home({
  source,
  pageType,
  pageTitle,
  publishDate,
  slug,
}) {
  const post = useRef()
  const { readingTime, wordsCount } = useReadingTime(post)
  return (
    <Box
      sx={{
        bg: 'background',
        boxShadow: 'card',
        borderRadius: '4px',
        gridArea: 'body',
      }}
    >
      {pageType == ('Blog' || 'Gallery') ? (
        <PageHeader
          pageTitle={pageTitle}
          publishDate={publishDate}
          readingTime={readingTime}
          wordsCount={wordsCount}
          slug={slug}
        />
      ) : (
        ''
      )}
      <Box
        sx={{
          p: 4,
        }}
      >
        <article ref={post}>
          <MDXRemote {...source} />
        </article>
      </Box>
    </Box>
  )
}

//////////////// PAGE PATHS /////////////////////

// We use getStaticPaths to get all the slugs at build time
export async function getStaticPaths() {
  // We define our query here
  const { data } = await client.query({
    query: gql`
      query SlugsIndex {
        pageCollection {
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
  // const paths = slugs.map(page => ({
  //   params: { slug: [page.slug] },
  // }))

  const paths = slugs.map(page => ({
    params: {
      slug: page.slug.includes('/') ? page.slug.split('/') : [page.slug],
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
