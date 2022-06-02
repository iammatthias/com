import Document, {
  DocumentContext,
  Html,
  Head,
  Main,
  NextScript,
} from 'next/document';

// import Segment Snippet
import * as snippet from '@segment/snippet';
import { getCssText } from '@/styles/stitches.config';

class MyDocument extends Document {
  segment() {
    const opts = {
      apiKey: process.env.NEXT_PUBLIC_SEGMENT,
      // note: the page option only covers SSR tracking.
      // Page.js is used to track other events using `window.analytics.page()`
      page: true,
    };

    if (process.env.NODE_ENV === `development`) {
      return snippet.max(opts);
    }

    return snippet.min(opts);
  }

  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);

    return initialProps;
  }

  render() {
    return (
      <Html lang="en-US">
        <Head>
          <script dangerouslySetInnerHTML={{ __html: this.segment() }} />

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
