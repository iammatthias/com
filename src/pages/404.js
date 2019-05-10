import React from 'react'
import styled from 'styled-components'
import Helmet from 'react-helmet'

import { Flex, Box } from 'rebass'

const Title = styled.h1`
  font-size: 75vh;
  text-transform: capitalize;
  font-weight: 600;
  margin: 0 0 3rem 0;
  line-height: 1.2;
`

const NotFoundPage = () => (
  <>
    <Helmet>
      <title>404 - Page Not Found</title>
      <meta name="description" content="Page not found" />
    </Helmet>

    <Flex
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
      mb={[5, 0]}
      className="changeDirection"
    >
      <Box p={[3, 4]} width={[1]}>
        <Box p={[3, 4]} width={[1]}>
          <Title>404</Title>
        </Box>
      </Box>
    </Flex>
  </>
)

export default NotFoundPage
