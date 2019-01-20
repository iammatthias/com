import React from 'react'
import styled from 'styled-components'
import { Link } from 'gatsby'

import { Box, Text, Heading } from 'rebass'

const StyledLink = styled(Link)`
  flex: 0 0 100%;
`

const TagList = props => {
  return (
    <StyledLink key={props.id} to={`${props.slug}/`}>
      <Box p={4}>
        <Heading>{props.title}</Heading>
        <Text>{props.date}</Text>
      </Box>
    </StyledLink>
  )
}

export default TagList
