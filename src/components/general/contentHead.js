import React from 'react'
import { Link } from 'gatsby'
import Headroom from 'react-headroom'

import styled from 'styled-components'

const HeadRoomContent = styled.div`
  padding: 1.5rem;
  @media screen and (min-width: 52em) {
    padding: 2.5rem;
  }
  @media screen and (min-width: 64em) {
    padding: 3.5rem;
  }
`

const ContentHead = props => {
  return (
    <Headroom
      className="relativeHeadroom"
      style={{
        position: 'fixed',
        zIndex: '300',
        transition: 'all .5s ease-in-out',
        background: 'var(--color-base-90)',
      }}
    >
      <HeadRoomContent>
        <Link
          to={props.displayExcerpt ? '/' : '/blog/'}
          className="noUnderline "
        >
          ⬅ Back
        </Link>
        <h1>{props.title}</h1>

        {props.displayExcerpt ? (
          <p
            dangerouslySetInnerHTML={{
              __html: props.body.childMarkdownRemark.html,
            }}
          />
        ) : null}
        {props.tags.map(tag => (
          <Link key={`${tag.slug}`} to={`/tag/${tag.slug}`}>
            <span className="linkAccentReset">🏷️</span> {tag.title}
          </Link>
        ))}
      </HeadRoomContent>
    </Headroom>
  )
}

export default ContentHead
