import type { AppProps } from "next/app";

// css
import "@/styles/reset.css";
import "@/styles/globals.css";

// fonts
import "@fontsource/space-grotesk";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/space-mono";

import Layout from "@/components/layout";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
