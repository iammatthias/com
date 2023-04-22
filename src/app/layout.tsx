import "./styles/reset.css";
import "./styles/globals.scss";
import "@rainbow-me/rainbowkit/styles.css";
import Providers from "@/app/lib/providers";

export const metadata = {
  title: "IAM",
  description: "IAM IAM IAM",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body>
        <Providers>
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
