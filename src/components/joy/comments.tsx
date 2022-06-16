import Link from 'next/link';
import { Button } from '../primitives/button';
import { TwitterLogoIcon } from '@radix-ui/react-icons';

// page header

export default function Comments({ ...props }: any) {
  const comments = `https://mobile.twitter.com/search?q=${encodeURIComponent(
    `https://iammatthias.com/${props.slug}`,
  )}`;

  console.log(props);
  return (
    <Link href={comments} passHref>
      <a>
        <Button css={{ ...props.css }} title="Discuss on Twitter">
          <TwitterLogoIcon />
        </Button>
      </a>
    </Link>
  );
}
