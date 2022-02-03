import type { AppProps } from 'next/app'
import MDX from '@/lib/mdxProvider'
import Layout from '@/components/layout'
import { ThemeProvider } from 'next-themes'
import { darkTheme } from '@/lib/stitches.config'
import { ApolloProvider } from '@apollo/client'
import client from '@/lib/apolloClient'

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
        <MDX>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </MDX>
      </ApolloProvider>
    </ThemeProvider>
  )
}

export default MyApp
