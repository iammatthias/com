import Link from 'next/link';
import { Crimson_Pro } from '@next/font/google';

// import Providers from './providers';

import DateTime from './components/dateTime';
// import Relay from './components/relay';

import './reset.css';
import './global.css';
import layout from './layout.module.css';

// import WalletButton from './components/walletButton';

const crimson_pro = Crimson_Pro({ preload: true });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${layout.layout}  ${crimson_pro.className}`}>
        {/* <Providers> */}
        <>
          <header className={`${layout.header} `}>
            <p>
              <Link href="/" title="hey, I am Matthias">
                Hey, I am Matthias
              </Link>
            </p>
          </header>

          <main className={layout.main}>{children}</main>
          {/* <Relay /> */}
          <footer className={`${layout.footer} `}>
            {/* <WalletButton /> */}
            <DateTime />

            <div className={`${layout.footerMeta} `}>
              <p>
                <Link href="https://nf.td/iam">@iammatthias</Link>
              </p>
              <p>
                <Link href="mailto:hey@iammatthias.com?subject=Hello%20there!">
                  hey@iammatthias.com
                </Link>
              </p>
            </div>
          </footer>
        </>
        {/* </Providers> */}
      </body>
    </html>
  );
}
