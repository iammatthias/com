import React from 'react'
import styled from 'styled-components'
import Img from 'gatsby-image'

const Hero = styled.div`
  position: relative;
  div {
    max-height: 61.8vh !important;
    width: 100%;
    object-fit: cover !important;
  }
  box-shadow: 0px 5px 15px var(--color-secondary-50),
    0px 10px 25px var(--color-secondary-25),
    0px 15px 30px var(--color-secondary-15);
`

const HomeHero = props => {
  return (
    <Hero>
      <Img fluid={props.image.fluid} />
    </Hero>
  )
}

export default HomeHero
