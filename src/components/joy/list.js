/** @jsx jsx */

import React from 'react'; //eslint-disable-line
import { jsx, Box } from 'theme-ui';
import { Link } from 'gatsby';

import { useSiteMetadata } from '../../hooks/use-site-metadata';

export default function List({ type, location }) {
  const { allContentfulPage } = useSiteMetadata();

  const listPages = allContentfulPage.edges;

  console.log(location);

  return (
    <>
      {listPages.map(
        (listPage) =>
          listPage.node.pageType === type && (
            <Link
              key={listPage.node.id}
              to={
                listPage.node.pageType === 'Gallery'
                  ? '/' + listPage.node.slug
                  : listPage.node.pageType === 'Blog'
                  ? '/' + listPage.node.slug
                  : '/' + listPage.node.slug
              }
            >
              <Box
                sx={{
                  paddingBottom: '2rem',
                  borderBottom: '1px solid',
                  borderColor: 'inherit',
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
