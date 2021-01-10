/** @jsx jsx */

import React from 'react'; //eslint-disable-line
import { jsx, Box, Text } from 'theme-ui';
import { Link } from 'gatsby';

import { globalHistory } from '@reach/router';

import { useSiteMetadata } from '../../hooks/use-site-metadata';

export default function PageList({ type, limit }) {
  const { listPages, listBlog, listGallery } = useSiteMetadata();

  const listLimit = limit ? limit : 10;

  const pages =
    type === 'Page'
      ? listPages.edges
      : type === 'Blog'
      ? listBlog.edges
      : type === 'Gallery'
      ? listGallery.edges
      : '';

  const path =
    type === 'Page'
      ? '/'
      : type === 'Blog'
      ? 'blog/'
      : type === 'Gallery'
      ? 'photography/'
      : '';

  return pages.slice(0, listLimit).map(
    (listPage) =>
      listPage.node.pageType === type && (
        <Link
          key={listPage.node.id}
          to={path + listPage.node.slug}
          sx={{ textDecoration: 'none' }}
        >
          <Box
            sx={{
              marginBottom: '2rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid',
              borderColor: 'inherit',
              width: ['100%', '50%'],
            }}
          >
            <Text
              as="p"
              sx={{ paddingBottom: '0', textDecoration: 'underline' }}
            >
              {listPage.node.title}
            </Text>
            {type === 'Blog' ? (
              <Text as="small" sx={{ textDecoration: 'none' }}>
                {listPage.node.publishDate}
              </Text>
            ) : (
              ''
            )}
          </Box>
        </Link>
      )
  );
}
