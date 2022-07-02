// Button
// Language: typescript

// A reusable button component.

import { TwitterLogoIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import React from 'react';

import Button from '@/components/Button';
import Squiggle from '@/components/etc/Squiggle';
import Text from '@/components/Text';

type Props = {
  pagetitle?: string;
  pagetype?: string;
  publishdate?: string;
  slug?: string;
};

export const PageHeader = ({
  pagetitle,
  pagetype,
  publishdate,
  slug,
}: Props) => {
  const comments = `https://mobile.twitter.com/search?q=${encodeURIComponent(
    `https://iammatthias.com/${slug}`,
  )}`;
  return (
    <>
      <Text as="h2" kind="h2">
        {pagetitle}
      </Text>

      {pagetype === `Blog` && (
        <Text as="p" kind="p">
          <Text as="small" kind="small">
            Published: {publishdate}
          </Text>
        </Text>
      )}
      {(pagetype === `Blog` || pagetype === `Gallery`) && (
        <>
          <Link href={comments} passHref>
            <a>
              <Button kind="primary">
                <TwitterLogoIcon />
              </Button>
            </a>
          </Link>
          <Squiggle />
        </>
      )}
    </>
  );
};

export default PageHeader;
