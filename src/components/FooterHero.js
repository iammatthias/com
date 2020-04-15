import React from 'react'
import Image from 'gatsby-image'
import { StaticQuery, graphql } from 'gatsby'

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
                  fluid(maxWidth: 1280, quality: 60) {
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
          <div {...props}>
            <Image
              fluid={{
                ...randomizedImage.heroImage.fluid,
                aspectRatio: 2.2 / 1,
              }}
            />
          </div>
        )
      }}
    />
  )
}
