import type { AppProps } from 'next/app';
import '@/styles/reset.css';
import '@/styles/app.css';
import MDXProvider from '@/utils/mdxProvider';
import Layout from '@/components/layout';
import Background from '@/components/background';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <MDXProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
      <Background />
    </MDXProvider>
  );
}
