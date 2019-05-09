import React from 'react'
import { graphql } from 'gatsby'
import find from 'lodash/find'

import ContentHead from './../components/general/contentHead'
import PostHero from './../components/post/postHero'
import PostArticle from './../components/post/postArticle'
import SEO from './../components/general/SEO'

const PostTemplate = ({ data, location }) => {
  const {
    title,
    id,
    heroImage,
    body,
    publishDate,
    tags,
    slug,
  } = data.contentfulPost

  const discussUrl = `https://mobile.twitter.com/search?q=${encodeURIComponent(
    `https://iammatthias.com/blog/${slug}/`
  )}`

  const postIndex = find(
    data.allContentfulPost.edges,
    ({ node: post }) => post.id === id
  )
  return (
    <div location={location}>
      <SEO
        title={title}
        image={heroImage}
        description={body.childMarkdownRemark.metaExcerpt}
      />
      <ContentHead
        displayExcerpt={false}
        title={title}
        date={publishDate}
        tags={tags}
        time={body.childMarkdownRemark.timeToRead}
      />
      <PostHero image={heroImage} />

      <PostArticle
        body={body}
        previous={postIndex.previous}
        next={postIndex.next}
        discussUrl={discussUrl}
      />
    </div>
  )
}

export const query = graphql`
  query($slug: String!) {
    contentfulPost(slug: { eq: $slug }) {
      title
      id
      slug
      metaDescription {
        internal {
          content
        }
      }
      publishDate(formatString: "DD MMM YYYY")
      publishDateISO: publishDate(formatString: "YYYY-MM-DD")
      tags {
        title
        id
        slug
      }
      heroImage {
        title
        fluid(maxWidth: 1200, quality: 65) {
          ...GatsbyContentfulFluid_withWebp
        }
        ogimg: fluid(maxWidth: 900, quality: 65) {
          ...GatsbyContentfulFluid_withWebp
          src
        }
      }
      body {
        childMarkdownRemark {
          html
          excerpt(pruneLength: 320)
          metaExcerpt: excerpt(pruneLength: 120)
          timeToRead
        }
      }
    }
    allContentfulPost(
      limit: 1000
      sort: { fields: [publishDate], order: DESC }
    ) {
      edges {
        node {
          id
        }
        previous {
          slug
        }
        next {
          slug
        }
      }
    }
  }
`

export default PostTemplate
