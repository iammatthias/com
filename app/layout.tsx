import dynamic from "next/dynamic";
import Link from "next/link";
import { Crimson_Pro } from "@next/font/google";

import "./reset.css";
import "./global.css";
import layout from "./layout.module.css";

const crimson_pro = Crimson_Pro({ subsets: ["latin"] });

const date = new Date().toLocaleDateString();
const time = new Date().toLocaleTimeString("en-US", { hour12: false });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <head>
        <title>I AM MATTHIAS</title>
        <meta name='description' content='A digital garden' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <link rel='icon' href='/favicon.ico' />
      </head>
      <body className={`${layout.layout} ${crimson_pro.className}`}>
        <header className={layout.header}>
          <p>
            <Link href='/' title='hey, I am Matthias'>
              hey, I am Matthias
            </Link>
          </p>
        </header>

        <main className={layout.main}>{children}</main>
        <footer className={layout.footer}>
          <p>
            <Link href='mailto:hey@iammatthias.com?subject=Hello%20there!'>hey@iammatthias.com</Link>
          </p>
          {/* <div className={layout.clock}>
            <p>{date}</p>
            <p>{time}</p>
          </div> */}
          <p>
            <Link href='https://nf.td/iam'>@iammatthias</Link>
          </p>
        </footer>
      </body>
    </html>
  );
}
