import type { AppProps } from 'next/app'
import MDX from '@/lib/mdxProvider'
import Layout from '@/components/layout'
import { ThemeProvider } from 'next-themes'
import { darkTheme } from '@/lib/stitches.config'
import { ApolloProvider } from '@apollo/client'
import client from '@/lib/apolloClient'

import Meta from '@/components/meta'
import Nav from '@/components/blocks/nav'

import ClientOnly from '@/components/clientOnly'
import dynamic from 'next/dynamic'

const Background = dynamic(() => import('@/components/joy/bg/bg'))

import Script from 'next/script'
import * as snippet from '@segment/snippet'

function MyApp({ Component, pageProps }: AppProps) {
  function renderSnippet() {
    const opts = {
      apiKey: process.env.NEXT_PUBLIC_SEGMENT,
      // note: the page option only covers SSR tracking.
      // Page.js is used to track other events using `window.analytics.page()`
      page: true,
    }

    if (process.env.NODE_ENV === 'development') {
      return snippet.max(opts)
    }

    return snippet.min(opts)
  }
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
      <Script
        id="segment"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: renderSnippet() }}
      />
    </ThemeProvider>
  )
}

export default MyApp
