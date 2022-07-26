import { AppProps } from 'next/app';

import '@/styles/reset.css';

import Layout from '@/components/layout';
import Background from '@/components/background';
import MDXProvider from '@/utils/_MDXprovider';
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
