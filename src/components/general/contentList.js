import React from 'react'
import styled from 'styled-components'
import { Link } from 'gatsby'
import Img from 'gatsby-image'

const StyledLink = styled(Link)`
  position: relative;
  text-decoration: none;
  div {
    object-fit: cover !important;
    height: 100% !important;
    @media screen and (min-width: 52em) {
      height: 33vh !important;
    }
  }

  h5 {
    position: absolute;
    bottom: 2.5%;
    left: 5%;
    z-index: 3;
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
    background: var(--color-base-50);
  }
`

const BlogPosts = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: 1rem;
  @media screen and (min-width: 52em) {
    grid-template-columns: repeat(2, 1fr);
  }
  h5 {
    margin: 1rem 0;
    position: relative;
    bottom: 0;
    left: 0;
    z-index: 3;
  }
  div {
    z-index: 3;
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
            <Img fluid={props.image.fluid} />
            <h5>{props.title}</h5>
          </>
        ) : props.blogList ? (
          <BlogPosts>
            <Img fluid={props.image.fluid} />
            <div>
              <h5>{props.title}</h5>
              <h5 className="linkAccentReset">{props.time} min to read</h5>
              <div
                className="linkAccentReset"
                dangerouslySetInnerHTML={{
                  __html: props.excerpt.childMarkdownRemark.excerpt,
                }}
              />
            </div>
          </BlogPosts>
        ) : (
          <>
            <Img fluid={props.image.fluid} />
            <h5>{props.title}</h5>
          </>
        )}
      </>
    </StyledLink>
  )
}

export default ContentList
