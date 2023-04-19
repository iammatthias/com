import "./styles/reset.css";
import "./styles/globals.scss";
import NavBar from "./components/Navbar";
import navigationData from "./data/navigation.json";

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
        {/* <NavBar items={navigationData.links} /> */}
        <main>{children}</main>
      </body>
    </html>
  );
}
