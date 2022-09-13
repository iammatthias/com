import Document, { Head, Html, Main, NextScript } from 'next/document';
import React from 'react';
import { fonts } from '../styles/typography.css';

export default class MyDocument extends Document {
  static async getInitialProps(ctx: any) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          {Object.values(fonts).map(({ file }) => (
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
