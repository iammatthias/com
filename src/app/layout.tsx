import "./globals.css";
import "./typography.css";
import type { Metadata } from "next";

import Link from "next/link";
import MoonSunMoon from "@/components/moon_sun_moon";

export const metadata: Metadata = {
  metadataBase: new URL("https://iammatthias.com"),
  title: "I AM MATTHIAS",
  description: "a branch of the internet",
  openGraph: {
    title: "I AM MATTHIAS",
    description: "a branch of the internet",
    url: "https://iammatthias.com",
    siteName: "I AM MATTHIAS",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body>
        <Link href='/'>
          <MoonSunMoon />
        </Link>
        {children}
      </body>
    </html>
  );
}
