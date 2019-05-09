import React from 'react'
import { graphql } from 'gatsby'
import sortBy from 'lodash/sortBy'

import ContentList from './../components/general/contentList'
import Hero from './../components/general/Hero'
import Helmet from 'react-helmet'
import config from './../utils/siteConfig'

import { Flex, Box, Heading } from 'rebass'

const TagTemplate = ({ data, location }) => {
  const { tagHero } = data.contentfulHome
  const { title, slug } = data.contentfulTag

  const posts = sortBy(data.contentfulTag.post, 'publishDate').reverse()
  const galleries = sortBy(
    data.contentfulTag.extendedgallery,
    'publishDate'
  ).reverse()

  return (
    <div location={location}>
      <Helmet>
        <title>{`Tag: ${title} - ${config.siteTitle}`}</title>
        <meta
          property="og:title"
          content={`Tag: ${title} - ${config.siteTitle}`}
        />
        <meta property="og:url" content={`${config.siteUrl}/tag/${slug}/`} />
      </Helmet>

      <Flex flexWrap="wrap" mb={[5, 0]} className="changeDirection">
        <Box p={[3, 4]} width={[1, 1, 1 / 2, 1 / 3]}>
          <Box p={[3, 4]} width={[1]}>
            <Heading fontSize={[4, 5]}>Tag: {title}</Heading>
          </Box>
          <Flex width={[1]} flexWrap="wrap" flexDirection="row">
            {posts.map(post => (
              <ContentList
                key={post.id}
                slug={`/blog/${post.slug}/`}
                image={post.heroImage}
                title={post.title}
                date={post.publishDate}
              />
            ))}
            {galleries.map(gallery => (
              <ContentList
                key={gallery.id}
                slug={gallery.slug}
                image={gallery.heroImage}
                title={gallery.title}
                date={gallery.publishDate}
              />
            ))}
          </Flex>
        </Box>
        <Box p={0} width={[1, 1, 1 / 2, 2 / 3]}>
          <Hero image={tagHero} />
        </Box>
      </Flex>
    </div>
  )
}

export const query = graphql`
  query($slug: String!) {
    contentfulHome {
      tagHero {
        title
        fluid(maxWidth: 1000, quality: 65) {
          ...GatsbyContentfulFluid_withWebp
        }
      }
    }
    contentfulTag(slug: { eq: $slug }) {
      title
      id
      slug
      extendedgallery {
        id
        title
        slug
        publishDate(formatString: "MMMM DD, YYYY")
        heroImage {
          title
          fluid(maxWidth: 1000, quality: 65) {
            ...GatsbyContentfulFluid_withWebp
          }
        }
      }
      post {
        id
        title
        slug
        publishDate(formatString: "MMMM DD, YYYY")
        heroImage {
          title
          fluid(maxWidth: 1000, quality: 65) {
            ...GatsbyContentfulFluid_withWebp
          }
        }
      }
    }
  }
`

export default TagTemplate
