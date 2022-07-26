// Button
// Language: typescript

// A reusable button component.

import { TwitterLogoIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import React from 'react';

import Button from '@/_components/button';
import Squiggle from '@/_components/squiggle';
import Text from '@/_components/text';

type Props = {
  pagetitle?: string;
  pagetype?: string;
  publishdate?: string;
  updatedate?: string;
  slug?: string;
};

export const ContentStart = ({
  pagetitle,
  pagetype,
  publishdate,
  updatedate,
  slug,
}: Props) => {
  const comments = `https://mobile.twitter.com/search?q=${encodeURIComponent(
    `https://iammatthias.com/${slug}`,
  )}`;
  return (
    <>
      <Text as="h2" kind="h2" font="heading">
        {pagetitle}
      </Text>

      <Text as="p" kind="small">
        Published: {publishdate}
        {updatedate &&
          publishdate !== updatedate &&
          ` | Updated: ${updatedate}`}
      </Text>

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

export default ContentStart;
