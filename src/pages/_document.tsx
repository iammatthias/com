import Document, {
  DocumentContext,
  Html,
  Head,
  Main,
  NextScript,
} from 'next/document';

import { getCssText } from '@/styles/stitches.config';

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en-US">
        <Head>
          <script
            async
            defer
            data-website-id="ce0e2219-dc16-47e7-9211-19554e397773"
            src="https://a.iammatthias.com/umami.js"
          />

          <link
            rel="preload"
            href="/fonts/Mayes-Mayes.woff"
            as="font"
            type="font/woff"
            crossOrigin="anonymous"
          />
          <style
            id="stitches"
            dangerouslySetInnerHTML={{ __html: getCssText() }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
