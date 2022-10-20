import Link from 'next/link';

type Props = {
  href: string;
  children: React.ReactNode;
};

export default function EntryLink({ href, children }: Props) {
  if (
    href.startsWith(`/`) ||
    (typeof window !== `undefined` && href.startsWith(window.location.origin))
  ) {
    return (
      <Link href={href}>
        <a>{children}</a>
      </Link>
    );
  }

  return (
    // eslint-disable-next-line react/jsx-no-target-blank
    <a href={href} target={href.startsWith(`#`) ? `` : `_blank`} rel="noopener">
      {children}
    </a>
  );
}
