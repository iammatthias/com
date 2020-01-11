import React from 'react'
import styled from '@emotion/styled'
import Helmet from 'react-helmet'

import { Flex } from 'rebass'

const Title = styled.h1`
  font-size: 40vw;
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
      p={[3, 4]}
      mb={[5, 0]}
      css={{
        height: '100vh',
      }}
    >
      <Title>404</Title>
    </Flex>
  </>
)

export default NotFoundPage
