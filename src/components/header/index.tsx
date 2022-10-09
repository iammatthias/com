// a header component

import { header } from './header.css';
import Time from '@/utils/time';
import Link from 'next/link';

export default function Header() {
  return (
    <header className={`${header}`}>
      <span>
        <Link href="/">I am Matthias</Link>
      </span>
      <span>
        <Time />
      </span>
    </header>
  );
}
