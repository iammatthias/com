/** @jsx jsx */

import React from 'react'; //eslint-disable-line
import { useStaticQuery, graphql } from 'gatsby';
import { jsx, Box } from 'theme-ui';
import { Link } from 'gatsby';

export default function List({ type, location }) {
  const { allContentfulPage } = useStaticQuery(graphql`
    query {
      allContentfulPage {
        edges {
          node {
            id
            title
            pageType
            slug
          }
        }
      }
    }
  `);

  const listPages = allContentfulPage.edges;

  return (
    <>
      {/* {listPages.map(
        (listPage) =>
          listPage.node.pageType === type && (
            <Link
              getProps={{ location }}
              to={
                listPage.node.pageType === 'Gallery'
                  ? '/' + listPage.node.slug
                  : listPage.node.pageType === 'Blog'
                  ? '/' + listPage.node.slug
                  : '/' + listPage.node.slug
              }
            >
              <Box
                key={listPage.node.id}
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
      )} */}
    </>
  );
}
