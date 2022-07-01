// _app.tsx
// Language: typescript

import '@/styles/app.css';
import 'react-static-tweets/styles.css';

import { AppProps } from 'next/app';

import Background from '@/components/Background';
import Layout from '@/components/Layout';
import LowPolySVG from '@/components/LowPolySVG';
import Navigation from '@/components/Navigation';
import SEO from '@/components/SEO';
import MDX from '@/utils/MdxProvider';
import Web3Provider from '@/utils/web3Provider';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Web3Provider>
      <Layout as="section" layout="page">
        <SEO title={pageProps.pageTitle} />
        <Navigation />

        <MDX>
          <Component {...pageProps} />
        </MDX>

        <LowPolySVG />
      </Layout>
      <Background />
    </Web3Provider>
  );
}
