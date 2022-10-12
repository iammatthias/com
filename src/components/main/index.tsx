import { main, alignCenter } from './main.css';
import { article } from './article.css';

import { useRouter } from 'next/router';

type Props = {
  children: React.ReactNode;
};

export default function Main({ children }: Props) {
  const { pathname } = useRouter();

  const isHome = pathname === `/`;

  return (
    <main className={`${main} ${isHome && alignCenter}`}>
      <article className={`${article} `}>{children}</article>
    </main>
  );
}
