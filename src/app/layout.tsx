import Script from "next/script";
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
  metadataBase: new URL("https://iammatthias.com"),
  title: "IAM ☾ ☼ ☽",
  description: "a digital garden",
  openGraph: {
    locale: "en_US",
    url: "https://iammatthias.com",
    title: "IAM ☾ ☼ ☽",
    description: "a digital garden",
    images: [
      {
        url: "api/og",
        width: 1200,
        height: 630,
        alt: "iammatthias.com",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IAM ☾ ☼ ☽",
    description: "a digital garden",
    creator: "@iammatthias",
    images: [
      {
        url: "api/og",
        width: 1200,
        height: 630,
        alt: "iammatthias.com",
      },
    ],
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  robots: {
    index: false,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: false,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    types: {
      "application/rss+xml": "feed/rss.xml",
      "application/atom+xml": "feed/atom.xml",
      "application/json": "feed/json.json",
    },
  },
  themeColor: "#d4af37",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body>
        <main className={`main`}>
          <Link href='/' className={`solar`}>
            ☾ ☼ ☽
          </Link>

          <div className={`localMeta`}>
            <CurrentTime /> <CurrentDate /> <CurrentWeather />
          </div>
          {children}
        </main>
      </body>
      <Script
        src='https://analytics.umami.is/script.js'
        data-website-id='e00518e8-b927-407a-bc4c-3ee75648f3bb'
        data-do-not-track='true'
      />
    </html>
  );
}
