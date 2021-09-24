/** @jsx jsx */

import React from 'react'; //eslint-disable-line
import { jsx, Box, Text } from 'theme-ui';
import { lighten } from '@theme-ui/color';

import Link from './link';
import { useSiteMetadataList } from '../hooks/use-site-metadata-lists';

export default function PageList({ type, limit }) {
  const { galleries, posts } = useSiteMetadataList();

  const listLimit = limit ? limit : 1000;

  const pages = type === 'Blog' ? posts.edges : type === 'Gallery' ? galleries.edges : '';

  const path = type === 'Blog' ? 'blog/' : type === 'Gallery' ? 'photography/' : '';

  return pages.slice(0, listLimit).map(
    (listPage) =>
      listPage.node.pageType === type && (
        <Link key={listPage.node.id} href={'https://iammatthias.com' + path + listPage.node.slug} sx={{ textDecoration: 'none' }}>
          <Box
            sx={{
              p: ['.5rem', '1rem'],
              width: ['100%'],
              backgroundColor: lighten('background', 0.025),
              position: 'relative',
              borderRadius: '4px',
            }}>
            <Text as='h3' sx={{ paddingBottom: '0' }}>
              {listPage.node.title}
            </Text>

            <Text as='small'>{listPage.node.publishDate}</Text>
          </Box>
        </Link>
      )
  );
}
