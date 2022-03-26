import Anchor from 'next/link';

export default function Link({ children, ...props }: any) {
  return (
    <Anchor passHref {...props}>
      <a>{children}</a>
    </Anchor>
  );
}
