import React from 'react'
import styled from 'styled-components'
import Helmet from 'react-helmet'
import Layout from './../components/general/Layout'

import { Flex } from 'rebass'

const Text = styled.p`
  text-align: center;
  line-height: 1.6;
  margin: 0 0 1em 0;
`

const Title = styled.h1`
  font-size: 3em;
  text-transform: capitalize;
  font-weight: 600;
  margin: 0 0 3rem 0;
  line-height: 1.2;
`

const NotFoundPage = ({ location }) => (
  <Layout location={location}>
    <Helmet>
      <title>404 - Page Not Found</title>
      <meta name="description" content="Page not found" />
    </Helmet>

    <Flex
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
      css={{
        height: '100vh',
      }}
    >
      <Title>Error 404</Title>
      <Text>Sorry, that page can't be found</Text>
    </Flex>
  </Layout>
)

export default NotFoundPage
