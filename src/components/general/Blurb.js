import React from 'react'
import { Box } from 'rebass'

const Blurb = props => {
  return (
    <Box p={[3, 4]} width={[1]}>
      <article
        dangerouslySetInnerHTML={{
          __html: props.content.childMarkdownRemark.html,
        }}
      />
    </Box>
  )
}

export default Blurb
