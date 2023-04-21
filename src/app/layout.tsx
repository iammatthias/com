import "./styles/reset.css";
import "./styles/globals.scss";
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
          {/* <NavBar items={navigationData.links} /> */}
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
