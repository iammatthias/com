import { main } from './main.css';
import { article } from './article.css';

type Props = {
  children: React.ReactNode;
};

export default function Main({ children }: Props) {
  return (
    <main className={`${main}`}>
      <article className={`${article}`}>{children}</article>
    </main>
  );
}
