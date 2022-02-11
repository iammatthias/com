import type { AppProps } from 'next/app'
import MDX from '@/lib/mdxProvider'
import Layout from '@/components/layout'
import { ThemeProvider } from 'next-themes'
import { darkTheme } from '@/lib/stitches.config'
import { ApolloProvider } from '@apollo/client'
import client from '@/lib/apolloClient'

import Meta from '@/components/meta'
import Nav from '@/components/blocks/nav'

import Background from '@/components/joy/bg/bg'
import ClientOnly from '@/components/clientOnly'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      value={{
        dark: darkTheme.className,
        light: 'light',
      }}
    >
      <ApolloProvider client={client}>
        <Meta />
        <MDX>
          <Nav />
          <Layout>
            <Component {...pageProps} />
          </Layout>
          <ClientOnly>
            <Background />
          </ClientOnly>
        </MDX>
      </ApolloProvider>
    </ThemeProvider>
  )
}

export default MyApp
