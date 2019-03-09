import React from 'react'
import { graphql } from 'gatsby'
import sortBy from 'lodash/sortBy'
import Layout from './../components/general/Layout'
import TagList from './../components/tag/tagList'
import Helmet from 'react-helmet'
import config from './../utils/siteConfig'

import { Flex, Box, Heading } from 'rebass'

const TagTemplate = ({ data, location }) => {
  const { title, slug } = data.contentfulTag

  const posts = sortBy(data.contentfulTag.post, 'publishDate').reverse()
  const galleries = sortBy(
    data.contentfulTag.extendedgallery,
    'publishDate'
  ).reverse()

  return (
    <Layout location={location}>
      <Helmet>
        <title>{`Tag: ${title} - ${config.siteTitle}`}</title>
        <meta
          property="og:title"
          content={`Tag: ${title} - ${config.siteTitle}`}
        />
        <meta property="og:url" content={`${config.siteUrl}/tag/${slug}/`} />
      </Helmet>
      <Flex width={1} p={4} flexWrap="wrap" flexDirection="row">
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
