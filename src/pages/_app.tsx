import type { AppProps } from 'next/app';

// css
import '@/styles/reset.css';
import '@/styles/globals.css';

// fonts
import '@fontsource/space-grotesk';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/space-mono';

// components
import Layout from '@/components/layout';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Main from '@/components/main';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Layout>
      <Header />

      <Main>
        <Component {...pageProps} />
      </Main>
      <Footer />
    </Layout>
  );
}
