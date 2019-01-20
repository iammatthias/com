import React from 'react'
import styled from 'styled-components'
import Img from 'gatsby-image'

const Wrapper = styled.div`
  width: 100%;
  padding: 0;
`

const Hero = styled.div`
  width: 100%;
  grid-area: left;
  pointer-events: none;
  transition: opacity 0.3s, visibility 0.3s;
  height: 55vh;
  div {
    height: 100% !important;
    object-fit: cover !important;
  }
`

const ArticleHero = props => {
  return (
    <Wrapper>
      <Hero>
        <Img fluid={props.image.fluid} />
      </Hero>
    </Wrapper>
  )
}

export default ArticleHero
