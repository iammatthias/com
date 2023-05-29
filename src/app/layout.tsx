import Head from "next/head";
import "./reset.scss";
import "./globals.scss";
import "./typography.scss";

import Link from "next/link";

import {
  CurrentDate,
  CurrentTime,
  CurrentWeather,
} from "@/app/components/current";

export const metadata = {
  title: "IAM",
  description: "a digital garden",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <Head>
        <link
          rel='alternate'
          type='application/rss+xml'
          title='iammatthias.com rss feed'
          href='feed/rss.xml'
        />
        <link
          rel='alternate'
          type='application/atom+xml'
          title='iammatthias.com atom feed'
          href='feed/atom.xml'
        />
        <link
          rel='alternate'
          type='application/json'
          title='iammatthias.com json feed'
          href='feed/json.json'
        />

        {/* og images */}

        <meta property='og:image' content='<generated>' />
        <meta property='og:image:type' content='<generated>' />
        <meta property='og:image:width' content='<generated>' />
        <meta property='og:image:height' content='<generated>' />

        {/* twitter images */}

        <meta name='twitter:image' content='<generated>' />
        <meta name='twitter:image:type' content='<generated>' />
        <meta name='twitter:image:width' content='<generated>' />
        <meta name='twitter:image:height' content='<generated>' />
      </Head>

      <body>
        <main className={`main`}>
          <Link href='/' className={`solar`}>
            ☾ ☼ ☽
          </Link>

          <div>
            <CurrentTime /> <CurrentDate /> <CurrentWeather />
          </div>
          {children}
        </main>
      </body>
    </html>
  );
}
