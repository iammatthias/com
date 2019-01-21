import React from 'react'
import { Link } from 'gatsby'
import Headroom from 'react-headroom'

import { Flex, Box, Heading } from 'rebass'

const GalleryHead = props => {
  return (
    <Headroom
      style={{
        position: 'fixed',
        zIndex: '899',
        transition: 'all .5s ease-in-out',
      }}
    >
      <Flex
        p={4}
        width={[1]}
        flexWrap="wrap"
        flexDirection="column"
        bg="var(--color-base)"
      >
        <Box>
          <Link to={`/`}>
            <Heading>⬅ Back</Heading>
          </Link>
        </Box>
        <Heading>{props.title}</Heading>
        <Flex
          width={[1]}
          flexWrap="wrap"
          alignContent="center"
          flexDirection="row"
        >
          {props.tags.map(tag => (
            <Box key={tag.id} pr={4}>
              <Link to={`/tag/${tag.slug}/`}>{tag.title}</Link>
            </Box>
          ))}
        </Flex>
      </Flex>
    </Headroom>
  )
}

export default GalleryHead
