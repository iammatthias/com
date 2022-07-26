import { AppProps } from 'next/app';

import '@/styles/reset.css';

import Layout from '@/_components/layout';
import Background from '@/_components/background';
import MDXProvider from '@/utils/MDXprovider';
import Web3Provider from '@/utils/web3Provider';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Web3Provider>
      <MDXProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
        <Background />
      </MDXProvider>
    </Web3Provider>
  );
}
