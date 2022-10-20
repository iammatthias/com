import Link from 'next/link';
import { article, main, personal } from './main.css';

type Props = {
  children: React.ReactNode;
};

export default function Main({ children }: Props) {
  return (
    <div className={`${main}`}>
      <div className={`${personal}`}>
        <p>hi, i am matthias</p>
        <p>
          t <Link href="https://twitter.com/iamMatthias">@iammatthias</Link>
        </p>
        <p>
          f <Link href="https://outcaster.xyz/iammatthias">@iammatthias</Link>
        </p>
        <p>
          g <Link href="https://github.com/iammatthias">@iammatthias</Link>
        </p>
      </div>
      <article className={`${article}`}>{children}</article>
    </div>
  );
}
