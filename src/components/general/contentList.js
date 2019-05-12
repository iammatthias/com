import React from 'react'
import styled from 'styled-components'
import { Link } from 'gatsby'
import Img from 'gatsby-image'

const StyledLink = styled(Link)`
  position: relative;
  width: 100%;
  height: 100%;
  text-decoration: none;
  &:hover div {
    @supports (object-fit: cover) {
      opacity: 1;
      visibility: visible;
    }
  }
  h2,
  h3 {
    margin: 0;
  }
`

const Cover = styled.div`
  position: relative;
  transition: none;
  margin-bottom: 1rem;
  height: 100%;
  div {
    height: 100% !important;
    object-fit: cover !important;
  }
  &::before {
    transition: all 0.3s;
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    top: 0;
    height: 100%;
    width: 100%;
    z-index: 2;
    background: var(--color-base-75);
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
    div {
      height: 100% !important;
      object-fit: cover !important;
    }
    &::before {
      display: none;
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
    div {
      height: 100% !important;
      object-fit: cover !important;
    }
  }
`
const Overflow = styled.div`
  display: inline-block;
  overflow: none;
  position: absolute;
  bottom: 0.5em;
  padding: 0.75rem;
  z-index: 2;
  font-size: 38.2%;
  @media screen and (min-width: 52em) {
    font-size: 100%;
    bottom: 0;
    display: block;
    position: relative;
    padding: 0.25rem 0;
  }
`

const ContentList = props => {
  return (
    <StyledLink
      key={props.id}
      to={props.blogList ? `/blog/${props.slug}/` : `/${props.slug}/`}
    >
      <>
        <Cover>
          <Img fluid={props.image.fluid} />
        </Cover>
        {props.galleryList ? (
          <Overflow>
            <h2>{props.title}</h2>
            <p
              className="hide linkAccentReset"
              dangerouslySetInnerHTML={{
                __html: props.excerpt.childMarkdownRemark.excerpt,
              }}
            />
          </Overflow>
        ) : props.blogList ? (
          <>
            <h2>{props.title}</h2>
            <h3 className="linkAccentReset-bold">
              Published: {props.date} | Reading time: {props.time} min
            </h3>

            <p
              className="linkAccentReset"
              dangerouslySetInnerHTML={{
                __html: props.excerpt.childMarkdownRemark.excerpt,
              }}
            />
          </>
        ) : (
          <h2>{props.title}</h2>
        )}
      </>
    </StyledLink>
  )
}

export default ContentList
