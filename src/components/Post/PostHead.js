import React from 'react'
import { Link } from 'gatsby'
import Headroom from 'react-headroom'

import { Flex, Box, Heading, Text } from 'rebass'

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
        p={[4, 5]}
        width={[1]}
        flexWrap="wrap"
        flexDirection="column"
        bg="var(--color-secondary)"
      >
        <Box>
          <Link to={`/blog/`} className="noUnderline">
            <Heading color="var(--color-accent)">⬅ Back</Heading>
          </Link>
        </Box>
        <Heading color="var(--color-accent)" fontSize={5}>
          {props.title}
        </Heading>
        <Heading color="var(--color-accent)" fontSize={3}>
          Published: {props.date} <br /> Reading time: {props.time} min
        </Heading>
        <Flex
          width={[1]}
          flexWrap="wrap"
          alignContent="center"
          flexDirection="row"
        >
          {props.tags.map(tag => (
            <Box key={tag.id} pr={4}>
              <Link to={`/tag/${tag.slug}/`}>
                <Text color="var(--color-accent)">{tag.title}</Text>
              </Link>
            </Box>
          ))}
        </Flex>
      </Flex>
    </Headroom>
  )
}

export default GalleryHead
