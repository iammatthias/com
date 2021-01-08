/** @jsx jsx */

import React from 'react'; //eslint-disable-line
import { jsx, Box } from 'theme-ui';
import { Link } from 'gatsby';

import { globalHistory } from '@reach/router';

import { useSiteMetadata } from '../../hooks/use-site-metadata';

export default function PageList({ type, limit }) {
  const { listPages, listBlog, listGallery } = useSiteMetadata();

  // const path = globalHistory.location.pathname;

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

  console.log('list:', pages);

  return (
    <>
      {pages.slice(0, listLimit).map(
        (listPage) =>
          listPage.node.pageType === type && (
            <Link key={listPage.node.id} to={path + listPage.node.slug}>
              <Box
                sx={{
                  marginBottom: '1rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid',
                  borderColor: 'inherit',
                  width: ['100%', '50%'],
                }}
              >
                {listPage.node.title}
              </Box>
            </Link>
          )
      )}
    </>
  );
}
