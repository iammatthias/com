import React from 'react'
import styled from 'styled-components'
import { Link } from 'gatsby'
import Img from 'gatsby-image'

import { Flex as Base, Text, Heading } from 'rebass'

const StyledLink = styled(Link)`
  text-decoration: none;
  width: 100%;
`

export const Flex = styled(Base)`
  &:hover div {
    @supports (object-fit: cover) {
      opacity: 1;
      visibility: visible;
    }
  }
`
const Cover = styled.div`
  width: 100%;
  div {
    height: 100% !important;
    object-fit: cover !important;
  }
  @media screen and (min-width: 52em) {
        position: fixed !important;
    pointer-events: none;
    transition: opacity 0.3s, visibility 0.3s;
    width: 50%;
    height: 100vh;
    top: 0;
    right: 0;
    z-index: 2;
    opacity: 0;
    visibility: hidden;
  }
  }
  @media screen and (min-width: 64em) {
    position: fixed !important;
    pointer-events: none;
    transition: opacity 0.3s, visibility 0.3s;
    width: 66.666%;
    height: 100vh;
    top: 0;
    right: 0;
    z-index: 2;
    opacity: 0;
    visibility: hidden;
  }
`
const BlogList = props => {
  return (
    <StyledLink key={props.id} to={`/blog/${props.slug}/`}>
      <Flex width={1} mb={3} flexWrap="wrap" flexDirection="column">
        <Cover>
          <Img fluid={props.image.fluid} />
        </Cover>
        <Heading>{props.title}</Heading>
        <Text>
          Published: {props.date} | Reading time: {props.time} min
        </Text>
        <Text
          dangerouslySetInnerHTML={{
            __html: props.excerpt.childMarkdownRemark.excerpt,
          }}
        />
      </Flex>
    </StyledLink>
  )
}

export default BlogList
