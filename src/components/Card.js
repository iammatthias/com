/** @jsx jsx */

import React from 'react' //eslint-disable-line
import { jsx, Styled } from 'theme-ui'
import styled from '@emotion/styled'
import { Link } from 'gatsby'
import Img from 'gatsby-image'

const Post = styled.li`
  position: relative;
  border-radius: 2px;
  margin: 0 0 1em 0;
  width: 100%;
  transition: background 0.2s;
  background: ${props => props.theme.colors.secondary};
  box-shadow: -25px -25px 75px ${props => props.theme.colors.background},
    25px 25px 100px ${props => props.theme.colors.shadow};
  @media screen and (min-width: ${props => props.theme.responsive.small}) {
    flex: ${props => (props.featured ? '0 0 100%' : '0 0 49%')};
    margin: 0 0 2vw 0;
  }
  @media screen and (min-width: ${props => props.theme.responsive.medium}) {
    flex: ${props => (props.featured ? '0 0 100%' : '0 0 32%')};
  }

  a {
    display: flex;
    flex-flow: column;
    height: 100%;
    width: 100%;
    color: ${props => props.theme.colors.text};
    text-decoration: none;
    .gatsby-image-wrapper {
      height: 0;
      padding-bottom: 60%;
      @media screen and (min-width: ${props => props.theme.responsive.small}) {
        padding-bottom: ${props => (props.featured ? '40%' : '60%')};
      }
    }
  }
`

const Card = ({ slug, heroImage, title, publishDate, body, ...props }) => {
  return (
    <>
      {heroImage && (
        <Post featured={props.featured}>
          <Link to={`${props.basePath}/${slug}/`}>
            <Img
              fluid={heroImage.fluid}
              backgroundColor={'#eeeeee'}
              sx={{ mb: 3 }}
            />
            <Styled.h3 sx={{ mx: 3 }}>{title}</Styled.h3>
            <Styled.p sx={{ mx: 3 }}>
              {publishDate}
              {body &&
                ' / / ' +
                  `${body.childMarkdownRemark.timeToRead}` +
                  ' minute read'}
            </Styled.p>
          </Link>
        </Post>
      )}
    </>
  )
}

export default Card
