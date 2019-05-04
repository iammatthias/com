import React from 'react'
import { Link } from 'gatsby'
import Headroom from 'react-headroom'

import { Flex, Box, Heading, Text } from 'rebass'

const ContentHead = props => {
  return (
    <Headroom
      className="relativeHeadroom"
      style={{
        position: 'fixed',
        zIndex: '300',
        transition: 'all .5s ease-in-out',
      }}
    >
      <Flex
        p={[4, 5]}
        width={[1]}
        flexWrap="wrap"
        flexDirection="column"
        bg="var(--color-base-95)"
      >
        <Box>
          <Link
            to={props.displayExcerpt ? '/' : '/blog/'}
            className="noUnderline linkAccentReset scopedLinkAccent"
          >
            <Heading css={{ display: 'inline-block' }}>⬅ Back</Heading>
          </Link>
        </Box>
        <Heading pt={3} pb={1} fontSize={5}>
          {props.title}
        </Heading>
        {props.displayExcerpt ? (
          <Text
            fontSize={2}
            py={1}
            dangerouslySetInnerHTML={{
              __html: props.body.childMarkdownRemark.html,
            }}
          />
        ) : null}

        <Flex
          width={[1]}
          flexWrap="wrap"
          alignContent="center"
          flexDirection="row"
        >
          {props.tags.map(tag => (
            <Box
              key={tag.id}
              mr={2}
              mb={2}
              className="tag linkAccentReset scopedLinkAccent"
            >
              <Link to={`/tag/${tag.slug}/`}>
                <Heading fontSize={3}>🏷️ {tag.title}</Heading>
              </Link>
            </Box>
          ))}
        </Flex>
      </Flex>
    </Headroom>
  )
}

export default ContentHead
