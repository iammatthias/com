import React from 'react'
import Img from 'gatsby-image'
import styled from '@emotion/styled'

const Wrapper = styled.section`
  position: relative;
  min-height: 300px;
  height: auto;
  margin-bottom: 3em;

  @media (min-width: ${props => props.theme.responsive.small}) {
    height: ${props => props.height || 'auto'};
  }
`
const BgImg = styled(Img)`
  position: absolute;
  width: 100%;
  height: 100%;
  background: ${props => props.theme.colors.secondary};
  box-shadow: -25px -25px 75px ${props => props.theme.colors.background},
    25px 25px 100px ${props => props.theme.colors.shadow};
  border: 1px solid;
  border-color: inherit;
  border-radius: 4px;
  text-decoration: none;
  overflow: hidden;
`

const Hero = props => (
  <Wrapper className="hero" height={props.height}>
    <BgImg fluid={props.image.fluid} />
  </Wrapper>
)

export default Hero
