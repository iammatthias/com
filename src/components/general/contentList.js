import React from 'react'
import styled from 'styled-components'
import { Link } from 'gatsby'
import Img from 'gatsby-image'

const StyledLink = styled(Link)`
  position: relative;
  text-decoration: none;
  border-radius: 0.5rem;
  background: rgba(var(--grey-800), 0.15);
  div {
    border-radius: 0.5rem;
    object-fit: cover !important;
    height: 100% !important;
    @media screen and (min-width: 52em) {
      height: 50vh !important;
    }
  }
  h5 {
    margin: 0;
    position: absolute;
    bottom: 1rem;
    left: 1rem;
    z-index: 3;
  }
  &::before {
    border-radius: 0.5rem;
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
    background: linear-gradient(
      var(--color-base-5) 38.2%,
      var(--color-base-35) 61.8%,
      var(--color-base-75) 100%
    );
  }

  box-shadow: var(--shadow);
`

const BlogPosts = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  border-radius: 0.5rem;
  div {
    border-radius: 0.5rem 0.5rem 0 0;
  }
  @media screen and (min-width: 52em) {
    div {
      border-radius: 0.5rem 0 0 0.5rem;
    }
    grid-template-columns: repeat(2, 1fr);
  }
  h5 {
    margin: 0 0 1rem;
    position: relative;
    bottom: 0;
    left: 0;
    z-index: 3;
  }
  div {
    z-index: 3;
  }
  .copy {
    margin: 2rem;
  }
`

const ContentList = props => {
  return (
    <StyledLink
      key={props.id}
      to={props.blogList ? `/blog/${props.slug}/` : `/${props.slug}/`}
    >
      <div>
        {props.galleryList ? (
          <>
            <Img fluid={props.image.fluid} />
            <h5>{props.title}</h5>
          </>
        ) : props.blogList ? (
          <BlogPosts>
            <Img className="hide" fluid={props.image.fluid} />
            <div className="copy">
              <h5>{props.title}</h5>

 <p className="linkAccentReset">Published {props. publishDate }</p>

              <p className="linkAccentReset">{props.time} min to read</p>
              <p
                className="small linkAccentReset"
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
      </div>
    </StyledLink>
  )
}

export default ContentList
