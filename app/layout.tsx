import Link from 'next/link';
import { Crimson_Pro } from '@next/font/google';

import DateTime from './components/dateTime';
// import Relay from './components/relay';

import './reset.css';
import './global.css';
import layout from './layout.module.css';
import Head from './head';

const crimson_pro = Crimson_Pro({ subsets: [`latin`] });

// const date = new Date().toLocaleDateString();
// const time = new Date().toLocaleTimeString('en-US', { hour12: false });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <Head />
      <body className={`${layout.layout} ${crimson_pro.className}`}>
        <header className={layout.header}>
          <p>
            <Link href="/" title="hey, I am Matthias">
              Hey, I am Matthias
            </Link>
          </p>
          <DateTime />
        </header>

        <main className={layout.main}>{children}</main>
        {/* <Relay /> */}
        <footer className={layout.footer}>
          <p>
            <Link href="mailto:hey@iammatthias.com?subject=Hello%20there!">
              hey@iammatthias.com
            </Link>
          </p>

          <p>
            <Link href="https://nf.td/iam">@iammatthias</Link>
          </p>
        </footer>
      </body>
    </html>
  );
}
