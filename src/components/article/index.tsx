import { article } from "./article.css";

type Props = {
  children: React.ReactNode;
};

export default function Article({ children }: Props) {
  return <article className={`${article}`}>{children}</article>;
}
