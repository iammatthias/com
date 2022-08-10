import { AppProps } from 'next/app';

import '@/styles/reset.css';
import 'react-static-tweets/styles.css';

import SEO from '@/components/seo';
import Layout from '@/components/layout';
import Background from '@/components/background';
import MDXProvider from '@/utils/MDXprovider';
import Web3Provider from '@/utils/web3Provider';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Web3Provider>
      <MDXProvider>
        <Layout>
          <SEO title={pageProps.pageTitle} name={pageProps.pageName} />
          <Component {...pageProps} />
        </Layout>
        <Background />
      </MDXProvider>
    </Web3Provider>
  );
}
