import React from 'react'

const Blurb = props => {
  return (
    <article
      dangerouslySetInnerHTML={{
        __html: props.content.childMarkdownRemark.html,
      }}
    />
  )
}

export default Blurb
