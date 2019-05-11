import React from 'react'
import { Link } from 'gatsby'
import { Flex, Box, Link as LinkExternal } from 'rebass'

require('../../styles/prism.css')

const Article = props => {
  return (
    <Box mx="auto" width={[1]} px={[4, 0]} py={4} mb={[5]}>
      <article
        dangerouslySetInnerHTML={{
          __html: props.body.childMarkdownRemark.html,
        }}
      />

      <Flex flexDirection={'column'}>
        {props.previous && (
          <Link className="button" to={`/blog/${props.previous.slug}/`}>
            <Box>Prev Post</Box>
          </Link>
        )}
        {props.next && (
          <Link className="button" to={`/blog/${props.next.slug}/`}>
            <Box>Next Post</Box>
          </Link>
        )}
        <LinkExternal className="button" color="" href={props.discussUrl}>
          <Box>Discuss on Twitter</Box>
        </LinkExternal>
      </Flex>
    </Box>
  )
}

export default Article
