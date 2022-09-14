import NextLink from 'next/link';
import { link } from './link.css';

type Props = {
  children: React.ReactNode;
  href: string;
  className?: string;
};

export default function Link({ children, href, className }: Props) {
  return (
    <NextLink href={href} passHref={true}>
      <a className={`${link} ${className}`}>
        <>{children}</>
      </a>
    </NextLink>
  );
}
