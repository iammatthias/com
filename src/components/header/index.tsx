// a header component

import { header, headerInfo } from './header.css';
import Time from '@/utils/time';
import Temp from '@/utils/temp';
import Link from 'next/link';

export default function Header() {
  return (
    <header className={`${header}`}>
      <Link href="/">/</Link>
      <div className={`${headerInfo}`}>
        <Time />
        <Temp />
      </div>
    </header>
  );
}
