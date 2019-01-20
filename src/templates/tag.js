import React from 'react'
import { graphql } from 'gatsby'
import sortBy from 'lodash/sortBy'
import Layout from '../components/Layout'
import TagList from '../components/Tag/TagList'

import { Flex, Box, Heading } from 'rebass'

const TagTemplate = ({ data, location }) => {
  const { title } = data.contentfulTag

  const posts = sortBy(data.contentfulTag.post, 'publishDate').reverse()
  const galleries = sortBy(
    data.contentfulTag.extendedgallery,
    'publishDate'
  ).reverse()

  return (
    <Layout location={location}>
      <Flex width={1} flexWrap="wrap" flexDirection="row">
        <Box width={1}>
          <Heading>Tag: {title}</Heading>
        </Box>
        <Flex width={[1, 1 / 2, 1 / 4]} flexWrap="wrap" flexDirection="column">
          {posts.map(post => (
            <TagList
              key={post.id}
              slug={`/blog/${post.slug}/`}
              image={post.heroImage}
              title={post.title}
              date={post.publishDate}
            />
          ))}
          {galleries.map(gallery => (
            <TagList
              key={gallery.id}
              slug={gallery.slug}
              image={gallery.heroImage}
              title={gallery.title}
              date={gallery.publishDate}
            />
          ))}
        </Flex>
      </Flex>
    </Layout>
  )
}

export const query = graphql`
  query($slug: String!) {
    contentfulTag(slug: { eq: $slug }) {
      title
      id
      slug
      extendedgallery {
        id
        title
        slug
        publishDate(formatString: "MMMM DD, YYYY")
      }
      post {
        id
        title
        slug
        publishDate(formatString: "MMMM DD, YYYY")
      }
    }
  }
`

export default TagTemplate
