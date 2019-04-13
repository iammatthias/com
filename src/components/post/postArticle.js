import React from 'react'
import { Link as Pagination } from 'gatsby'
import { Flex, Box, Link as Discussion } from 'rebass'

require('../../styles/prism.css')

const Article = props => {
  return (
    <Box mx="auto" width={[1, 3 / 4, 2 / 3, 1 / 2]} px={[4, 0]} py={4} mb={[5]}>
      <article
        className="postArticle"
        dangerouslySetInnerHTML={{
          __html: props.body.childMarkdownRemark.html,
        }}
      />

      <Flex>
        {props.previous && (
          <Pagination
            className="button marginRight"
            to={`/blog/${props.previous.slug}/`}
          >
            <Box>Prev Post</Box>
          </Pagination>
        )}
        {props.next && (
          <Pagination
            className="button marginRight"
            to={`/blog/${props.next.slug}/`}
          >
            <Box>Next Post</Box>
          </Pagination>
        )}
        <Discussion
          className="button marginRight"
          color=""
          href={props.discussUrl}
        >
          <Box>Discuss on Twitter</Box>
        </Discussion>
      </Flex>
    </Box>
  )
}

export default Article
