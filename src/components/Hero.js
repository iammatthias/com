import React from 'react'
import styled from 'styled-components'
import Img from 'gatsby-image'

const Hero = styled.div`
  position: relative;
  width: calc(100%);
  div {
    border-radius: 0.5rem;
    max-height: 61.8vh !important;
    object-fit: cover !important;
  }
  border-radius: 0.5rem;
  box-shadow: var(--shadow);
`

const HomeHero = props => {
  return (
    <Hero>
      <div>
        <Img fluid={props.image.fluid} />
      </div>
    </Hero>
  )
}

export default HomeHero
