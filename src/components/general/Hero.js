import React from 'react'
import styled from 'styled-components'
import Img from 'gatsby-image'

const Hero = styled.div`
  position: relative;
  width: calc(100%);
  div {
    max-height: 61.8vh !important;
    object-fit: cover !important;
  }
  box-shadow: var(--shadow);
`

const HomeHero = props => {
  return (
    <Hero>
      <Img fluid={props.image.fluid} />
    </Hero>
  )
}

export default HomeHero
