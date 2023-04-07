import "./reset.scss";
import "./globals.scss";
import "./typography.scss";
import Zorb from "@/ui/zorb";
import Link from "next/link";
import Nav from "@/ui/nav";
import { Providers } from "../lib/providers/providers";
import CursorProvider from "../lib/providers/cursorProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      {/*
        <head /> will contain the components returned by the nearest parent
        head.tsx. Find out more at https://beta.nextjs.org/docs/api-reference/file-conventions/head
      */}
      <head />
      {/* <Providers>
        <body>
          <CursorProvider>
            <>
              <Nav />
              {children}
            </>
          </CursorProvider>
        </body>
      </Providers> */}
      <body>
        <CursorProvider>
          <>
            <Nav />
            {children}
          </>
        </CursorProvider>
      </body>
    </html>
  );
}
