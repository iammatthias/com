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
