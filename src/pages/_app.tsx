import { AppProps } from 'next/app';
import { ThemeProvider } from 'next-themes';
import { darkTheme, globalStyles } from '@/styles/stitches.config';
import NavWrapper from '@/components/blocks/navigation/navWrapper';
import Layout from '@/components/layout';
import { MDX } from '@/lib/mdxProvider';
import Meta from '@/components/meta';
// import Background from '@/components/joy/background/backgroundWrapper';

// fonts
import '@fontsource/abril-fatface';
import '@fontsource/crimson-text/400.css';
import '@fontsource/crimson-text/700.css';
import '@fontsource/space-mono';
import '@fontsource/space-mono/700.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  globalStyles();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      value={{
        dark: darkTheme.className,
        light: `light`,
      }}
    >
      <Meta title={pageProps.pageTitle} />
      <NavWrapper />
      <Layout>
        <MDX {...pageProps}>
          <Component {...pageProps} />
        </MDX>
      </Layout>
      {/* <Background /> */}
    </ThemeProvider>
  );
}
