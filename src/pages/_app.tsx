// _app.tsx
// Language: typescript

import { AppProps } from 'next/app';
import Layout from '@/components/Layout';
import Navigation from '@/components/Navigation';
import Box from '@/components/Box';
import Text from '@/components/Text';

import '@/styles/app.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Layout layout="page">
      <Navigation />
      <Component {...pageProps} />
    </Layout>
  );
}
