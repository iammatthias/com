/** @jsx jsx */

import React from 'react' //eslint-disable-line
import { jsx, Styled } from 'theme-ui'
import styled from '@emotion/styled'
import { Link } from 'gatsby'

const Wrapper = styled.div`
  margin: 0;
  padding: 0 1.5em 2em;
`

const Box = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  margin: 0 auto;
  width: 100%;
  max-width: ${props => props.theme.sizes.maxWidthCentered};
  div {
    margin: 2em 0;
  }
  a {
    background: ${props => props.theme.colors.secondary};
    color: ${props => props.theme.colors.text} !important;
    padding: 1em;
    border-radius: 2px;
    text-decoration: none;
    transition: 0.2s;
    &:hover {
      background: ${props => props.theme.colors.highlight};
    }
  }
`

const PreviousLink = styled(Link)`
  order: 2;
  font-weight: bold;
`

const NextLink = styled(Link)`
  order: 3;
  margin: 0 0 0 1rem;
  font-weight: bold;
`

const PostLinks = props => {
  return (
    <Wrapper className="postLinks">
      <Box>
        <div>
          {props.comments && (
            <Styled.a href={props.comments}>Discuss on Twitter</Styled.a>
          )}
        </div>
        <div>
          {props.previous && (
            <PreviousLink to={`${props.basePath}/${props.previous.slug}/`}>
              &#8592; Prev
            </PreviousLink>
          )}

          {props.next && (
            <NextLink to={`${props.basePath}/${props.next.slug}/`}>
              Next &#8594;
            </NextLink>
          )}
        </div>
      </Box>
    </Wrapper>
  )
}

export default PostLinks
