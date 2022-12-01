import localFont from "@next/font/local";
import Layout from "@/components/layout";

// Font files can be colocated inside of `app`
const gta = localFont({ src: "./fonts/gta-mono.woff2" });

export default function RootLayout({
  // Layouts must accept a children prop.
  // This will be populated with nested layouts or pages
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' className={gta.className}>
      <head>
        <title>I am Matthias</title>
      </head>
      <body>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
