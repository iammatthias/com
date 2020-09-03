import React from 'react'
import Image from 'gatsby-image'
import { StaticQuery, graphql } from 'gatsby'

import styled from '@emotion/styled'

const FooterWrapper = styled.section`
  position: relative;
  z-index: 0;
  margin: -48px 8px 0;
  display: block;
  height: 100%;
  border: 1px solid;
  border-radius: 4px;
  overflow: hidden;
  @media screen and (min-width: 1281px) {
    margin: -128px 64px 0px;
    box-shadow: -5px -5px 100px ${props => props.theme.colors.background},
      25px 25px 100px ${props => props.theme.colors.shadow};
  }
`

const randomGenerator = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export default function Hero({ data, ...props }) {
  return (
    <StaticQuery
      query={graphql`
        {
          allContentfulPhotography {
            edges {
              node {
                heroImage {
                  id
                  fluid(maxWidth: 1200, quality: 35) {
                    ...GatsbyContentfulFluid_withWebp
                    src
                    aspectRatio
                  }
                }
              }
            }
          }
        }
      `}
      render={data => {
        const { allContentfulPhotography } = data
        const { edges } = allContentfulPhotography
        const randomPosition = randomGenerator(1, edges.length - 1)
        const randomizedImage = edges[randomPosition].node
        return (
          <FooterWrapper>
            <Image
              fluid={{
                ...randomizedImage.heroImage.fluid,
                aspectRatio: 2.2 / 1,
              }}
            />
          </FooterWrapper>
        )
      }}
    />
  )
}
