import React from 'react'
import { Link } from 'gatsby'
import { Flex, Box, Text } from 'rebass'
require('../../styles/prism.css')

const Article = props => {
  return (
    <Box mx="auto" width={[1, 3 / 4, 2 / 3, 1 / 2]} px={[4, 0]} py={4}>
      <Text
        dangerouslySetInnerHTML={{
          __html: props.body.childMarkdownRemark.html,
        }}
      />
      <Flex>
        {props.previous && (
          <Link to={`/blog/${props.previous.slug}/`}>
            <Box pr={4}>Prev Post</Box>
          </Link>
        )}
        {props.next && (
          <Link to={`/blog/${props.next.slug}/`}>
            <Box pr={4}>Next Post</Box>
          </Link>
        )}
      </Flex>
    </Box>
  )
}

export default Article
