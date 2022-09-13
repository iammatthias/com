import type { AppProps } from 'next/app';
import '@/styles/reset.css';
import '@/styles/app.css';
import MDXProvider from '@/utils/mdxProvider';
import Layout from '@/components/layout';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <MDXProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </MDXProvider>
  );
}
