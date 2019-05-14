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
  h2 {
    margin: 0 0 1rem;
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
  bottom: 0;
  padding: 0 0 0 1rem;
  z-index: 2;
  font-size: 61.8%;
  @media screen and (min-width: 52em) {
    font-size: 100%;
    bottom: 0;
    display: block;
    position: relative;
    padding: 0.25rem 0;
  }
`
const ListGrid = styled.div`
  display: grid;
  grid-template-columns: 50% 50%;
  grid-gap: 1rem;
  margin: 0 0 1rem;
  font-size: 61.8%;
  @media screen and (min-width: 52em) {
    font-size: 100%;
    display: grid;
    grid-template-columns: 1fr;
    margin: 0 0 2rem;
  }
`

const ContentList = props => {
  return (
    <StyledLink
      key={props.id}
      to={props.blogList ? `/blog/${props.slug}/` : `/${props.slug}/`}
    >
      <>
        {props.galleryList ? (
          <>
            <Cover>
              <Img fluid={props.image.fluid} />
            </Cover>
            <Overflow>
              <h2>{props.title}</h2>
              <div
                className="hide linkAccentReset"
                dangerouslySetInnerHTML={{
                  __html: props.excerpt.childMarkdownRemark.excerpt,
                }}
              />
            </Overflow>
          </>
        ) : props.blogList ? (
          <ListGrid>
            <Cover>
              <Img fluid={props.image.fluid} />
            </Cover>
            <div>
              <h2>{props.title}</h2>
              <h4 className="linkAccentReset-bold"> {props.date}</h4>
              <h4 className="linkAccentReset-bold">{props.time} min to read</h4>
              <div
                className="hide linkAccentReset"
                dangerouslySetInnerHTML={{
                  __html: props.excerpt.childMarkdownRemark.excerpt,
                }}
              />
            </div>
          </ListGrid>
        ) : (
          <ListGrid>
            <Cover>
              <Img fluid={props.image.fluid} />
            </Cover>
            <h2>{props.title}</h2>
          </ListGrid>
        )}
      </>
    </StyledLink>
  )
}

export default ContentList
