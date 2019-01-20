import React from 'react'
import styled from 'styled-components'
import Img from 'gatsby-image'

const Hero = styled.div`
  display: none;
  @media screen and (min-width: 52em) {
    display: block;
    position: fixed;
    pointer-events: none;
    width: 50%;
    height: 100vh;
    z-index: -1;
    div {
      height: 100% !important;
      object-fit: cover !important;
    }
  }
`

const HomeHero = props => {
  return (
    <Hero>
      <Img fluid={props.image.fluid} />
    </Hero>
  )
}

export default HomeHero
