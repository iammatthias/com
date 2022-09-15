import type { AppProps } from 'next/app';
import '@/styles/reset.css';
import '@/styles/app.css';
import 'react-static-tweets/styles.css';
import MDXProvider from '@/utils/mdxProvider';
import Layout from '@/components/layout';
import Web3Provider from '@/utils/web3Provider';
import Background from '@/components/background';

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
