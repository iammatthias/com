import * as React from 'react'

import Meta from '../components/meta'
import Layout from '../components/layout'
import MDXProvider from '../components/mdxProvider'
import theme from '../lib/theme'
import { ThemeProvider } from 'theme-ui'
import { ApolloProvider } from '@apollo/client'
import client from '../lib/utils/apolloClient'
import Router from 'next/router'

Router.events.on('routeChangeComplete', url => {
  global.analytics.page(url)
})

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider theme={theme}>
      <ApolloProvider client={client}>
        <MDXProvider>
          <Meta name={pageProps.metadata.title} />
          <Layout {...pageProps}>
            <Component {...pageProps} />
          </Layout>
        </MDXProvider>
      </ApolloProvider>
    </ThemeProvider>
  )
}
