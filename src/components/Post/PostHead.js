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
      <Flex p={4} width={[1]} flexWrap="wrap" flexDirection="column" bg="white">
        <Box>
          <Link to={`/blog/`}>
            <Heading>⬅ Back</Heading>
          </Link>
        </Box>
        <Heading>{props.title}</Heading>
        <Heading>
          Published: {props.date} <br /> Reading time: {props.time} min
        </Heading>
        <Flex
          width={[1]}
          flexWrap="wrap"
          alignContent="center"
          flexDirection="row"
        >
          {props.tags.map(tag => (
            <Box key={tag.id} pr={4} border="1px solid black">
              <Link to={`/tag/${tag.slug}/`}>{tag.title}</Link>
            </Box>
          ))}
        </Flex>
      </Flex>
    </Headroom>
  )
}

export default GalleryHead
