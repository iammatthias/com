import { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { ThemeProvider } from 'next-themes';
import { darkTheme } from '@/styles/stitches.config';
import NavWrapper from '@/components/blocks/navigation/navWrapper';
import Layout from '@/components/layout';
import MDX from '@/lib/mdxProvider';
import WagmiProvider from '@/lib/wagmiProvider';
import Meta from '@/components/meta';

// fonts
import '@fontsource/crimson-pro/900.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/900.css';
import '@fontsource/space-mono';

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const path = router.pathname;

  function Body() {
    return (
      <Layout>
        <MDX>
          <Component {...pageProps} />
        </MDX>
      </Layout>
    );
  }
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
      {path === `/guestbook` ? (
        <WagmiProvider>
          <Body />
        </WagmiProvider>
      ) : (
        <Body />
      )}
    </ThemeProvider>
  );
}
