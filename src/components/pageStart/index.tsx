import Link from 'next/link';
import React from 'react';

import Button from '@/components/button';
import Squiggle from '@/components/squiggle';
import Text from '@/components/text';
import Box from '../box';
import { pageStart } from './pageStart.css';

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
    <Box className={`${pageStart}`}>
      <Text as="h1" kind="h1" font="heading">
        {pagetitle}
      </Text>

      <Text as="h6" kind="h6" font="heading">
        Published: {publishdate}
        {updatedate &&
          publishdate !== updatedate &&
          ` | Updated: ${updatedate}`}
      </Text>

      {(pagetype === `Blog` || pagetype === `Gallery`) && (
        <>
          <Link href={comments} passHref>
            <a>
              <Button kind="primary">Discuss on Twitter ↗</Button>
            </a>
          </Link>
          <Squiggle />
        </>
      )}
    </Box>
  );
};

export default ContentStart;
