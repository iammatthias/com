import Document, { Head, Html, Main, NextScript } from 'next/document';
import React from 'react';
import { fontFiles } from '@/styles/reset.css';
import { isDev } from '@/utils/isDev';

export default class MyDocument extends Document {
  static async getInitialProps(ctx: any) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          {!isDev && (
            <script
              async
              defer
              data-website-id="ce0e2219-dc16-47e7-9211-19554e397773"
              src="https://a.iammatthias.com/umami.js"
            />
          )}
          {fontFiles.map((file) => (
            <link
              as="font"
              crossOrigin="anonymous"
              href={file}
              key={file}
              rel="preload"
            />
          ))}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
