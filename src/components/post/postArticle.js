import React from 'react'
import { Link } from 'gatsby'
import styled from 'styled-components'

require('../../styles/prism.css')

const Buttons = styled.div`
  grid-column: 3;
  margin-bottom: 5rem;
`

const Article = props => {
  return (
    <>
      <article
        className="article"
        dangerouslySetInnerHTML={{
          __html: props.body.childMarkdownRemark.html,
        }}
      />
      <Buttons className="article buttonColumn">
        {props.previous && (
          <Link className="button" to={`/blog/${props.previous.slug}/`}>
            Prev Post
          </Link>
        )}
        {props.next && (
          <Link className="button" to={`/blog/${props.next.slug}/`}>
            Next Post
          </Link>
        )}
        <a className="button" color="" href={props.discussUrl}>
          Discuss on Twitter
        </a>
      </Buttons>
    </>
  )
}

export default Article
