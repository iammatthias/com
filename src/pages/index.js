/** @jsx jsx */

import React from 'react' //eslint-disable-line

import { jsx } from 'theme-ui'
import { graphql } from 'gatsby'
import Img from 'gatsby-image'
import { MDXProvider } from '@mdx-js/react'
import MDXRenderer from 'gatsby-plugin-mdx/mdx-renderer'

import FitText from '@kennethormandy/react-fittext'

import SEO from '../components/SEO'

import { Wrapper, Content, ContentLink, GalleryList } from '../utils/Styled'
import { useSiteMetadata } from '../utils/Metadata'

const Index = ({ props, data }) => {
  const { introduction, metaImage } = useSiteMetadata()
  const contentfulGalleries = data.allContentfulExtendedGallery.edges

  return (
    <>
      <SEO title="MATTHIAS" image={metaImage} />
      <Wrapper>
        <Content className="introduction">
          <MDXProvider>
            <MDXRenderer>{introduction.childMdx.body}</MDXRenderer>
          </MDXProvider>
        </Content>
        <GalleryList className="galleries" id="bottom">
          {contentfulGalleries.map(({ node: gallery }) => (
            <ContentLink key={gallery.id} to={gallery.slug}>
              <Img fluid={{ ...gallery.heroImage.fluid, aspectRatio: 1 / 1 }} />
              <div className="fit">
                <FitText compressor={0.618}>
                  <p
                    sx={{
                      variant: 'styles.h1',
                    }}
                    className="knockout"
                  >
                    {gallery.title}
                  </p>
                </FitText>
              </div>
            </ContentLink>
          ))}
        </GalleryList>
      </Wrapper>
    </>
  )
}

export const query = graphql`
  query Index {
    allContentfulExtendedGallery(
      limit: 1000
      sort: { fields: [publishDate], order: DESC }
    ) {
      edges {
        node {
          title
          id
          slug
          publishDate(formatString: "DD MMM YYYY h:mm a")
          heroImage {
            title
            fluid(quality: 50) {
              ...GatsbyContentfulFluid_withWebp
            }
          }
        }
      }
    }
  }
`

export default Index
