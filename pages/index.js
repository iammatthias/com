/** @jsxImportSource theme-ui */
import { gql } from '@apollo/client'
import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote } from 'next-mdx-remote'
import client from '../lib/utils/apolloClient'
import generateRssFeed from '../lib/feed'
import { Box } from 'theme-ui'

export default function Home({ source }) {
  return (
    <Box
      sx={{
        bg: 'background',
        boxShadow: 'card',
        borderRadius: '4px',
        gridArea: 'body',
      }}
    >
      <Box sx={{ p: [3, 3, 4] }}>
        <article>
          <MDXRemote {...source} />
        </article>
      </Box>
    </Box>
  )
}

//////////////// PAGE CONTENT /////////////////////

// We use getStaticProps to get the content at build time
export async function getStaticProps() {
  // We define our query here
  const { data } = await client.query({
    query: gql`
      query {
        pageCollection(where: { slug: "home" }) {
          items {
            title
            body
          }
        }
      }
    `,
  })

  const source = data.pageCollection.items[0].body
  const mdxSource = await serialize(source)

  await generateRssFeed()

  // We return the result of the query as props to pass them above
  return {
    props: {
      metadata: data.pageCollection.items[0],
      source: mdxSource,
    },
  }
}
