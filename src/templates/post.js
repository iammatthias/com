import React from 'react'
import { graphql } from 'gatsby'
import find from 'lodash/find'
import Layout from './../components/general/Layout'
import PostHead from './../components/post/postHead'
import PostHero from './../components/post/postHero'
import PostArticle from './../components/post/postArticle'
import SEO from './../components/general/SEO'

const PostTemplate = ({ data }) => {
  const {
    title,
    id,
    heroImage,
    body,
    publishDate,
    tags,
    slug,
  } = data.contentfulPost
  const blog = data.contentfulBlog

  const discussUrl = `https://mobile.twitter.com/search?q=${encodeURIComponent(
    `https:/iammatthias.com/blog/${slug}/`
  )}`

  const postIndex = find(
    data.allContentfulPost.edges,
    ({ node: post }) => post.id === id
  )
  return (
    <Layout>
      <SEO title={title} image={blog.shareImage} />
      <PostHead
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
    </Layout>
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
        fluid(maxWidth: 1000, quality: 65) {
          ...GatsbyContentfulFluid_withWebp
        }
        ogimg: resize(width: 900) {
          src
          width
          height
        }
      }
      body {
        childMarkdownRemark {
          html
          excerpt(pruneLength: 320)
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
    contentfulBlog {
      shareImage {
        ogimg: resize(width: 1200) {
          src
          width
          height
        }
      }
    }
  }
`

export default PostTemplate
