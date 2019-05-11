import React from 'react'
import { Box } from 'rebass'

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
