// a header component

import { header } from './header.css';
import Time from '@/utils/time';

export default function Header() {
  return (
    <header className={`${header}`}>
      <span>I am Matthias</span>
      <span>
        <Time />
      </span>
    </header>
  );
}
