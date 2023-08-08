import { Suspense } from "react";
import "./globals.css";
import "./typography.css";
import type { Metadata } from "next";

import { Source_Code_Pro } from "next/font/google";
import Loading from "./loading";

export const metadata: Metadata = {
  title: "I AM MATTHIAS",
  description: "a branch of the internet",
};

const sourceCodePro = Source_Code_Pro({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body className={`${sourceCodePro.className}`}>
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </body>
    </html>
  );
}
