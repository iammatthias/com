import { main } from "./main.css";

type Props = {
  children: React.ReactNode;
};

export default function Main({ children }: Props) {
  return <main className={`${main}`}>{children}</main>;
}
