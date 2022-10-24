// A layout function component

import { layout } from "./layout.css";

import Header from "@/components/header";
import Main from "@/components/main";
import Footer from "@/components/footer";

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <div className={`${layout}`}>
      <Header />
      <Main>{children}</Main>
      <Footer />
    </div>
  );
}
