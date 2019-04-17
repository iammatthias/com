import React from 'react'
import styled from 'styled-components'
import Img from 'gatsby-image'

const Hero = styled.div`
  width: 100%;
  height: 100%;
  pointer-events: none;
  transition: opacity 0.3s, visibility 0.3s;
  div {
    height: 100% !important;
    object-fit: cover !important;
  }
`

const ArticleHero = props => {
  return (
    <Hero>
      <Img fluid={props.image.fluid} />
    </Hero>
  )
}

export default ArticleHero
