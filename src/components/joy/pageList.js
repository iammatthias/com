/** @jsx jsx */

import React from 'react'; //eslint-disable-line
import { jsx, Box, Text } from 'theme-ui';
import { lighten } from '@theme-ui/color';
import Link from './link';
import Img from 'gatsby-image';

import { useSiteMetadata } from '../../hooks/use-site-metadata';

export default function PageList({ type, limit }) {
  const { listPages, listBlog, listGallery } = useSiteMetadata();

  const listLimit = limit ? limit : 1000;

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

  console.count('counter');

  return pages.slice(0, listLimit).map(
    (listPage) =>
      listPage.node.pageType === type && (
        <Link
          key={listPage.node.id}
          href={'https://iammatthias.com' + path + listPage.node.slug}
          sx={{ textDecoration: 'none' }}
        >
          <Box
            sx={{
              padding: '0',
              width: ['100%'],
              backgroundColor: lighten('background', 0.025),
              transition: 'background-color .5s ease',
              '&:hover': {
                backgroundColor: lighten('background', 0.05),
                transition: 'background-color .5s ease',
              },
              position: 'relative',
              borderRadius: '4px',
            }}
          >
            {type === 'Gallery' ? (
              <Img
                fluid={{
                  ...listPage.node.masonry[
                    (listPage.node.masonry.length * Math.random()) | 0
                  ].images[0].fluid,
                  aspectRatio: 4 / 3,
                }}
                title={
                  listPage.node.masonry[
                    (listPage.node.masonry.length * Math.random()) | 0
                  ].images[0].title
                }
                alt={
                  listPage.node.masonry[
                    (listPage.node.masonry.length * Math.random()) | 0
                  ].images[0].title
                }
                sx={{ borderRadius: '4px' }}
              />
            ) : (
              ''
            )}
            <Box
              sx={{
                position: (props) =>
                  `${type === 'Gallery' ? 'absolute' : 'relative'}`,
                bottom: '0',
                left: '0',
                height: '100%',
                width: '100%',
                zIndex: '1',
                '&::before': {
                  content: '""',
                  opacity: (props) => `${type === 'Gallery' ? '.5' : '1'}`,
                  backgroundColor: lighten('background', 0.05),
                  zIndex: '2',
                  position: 'absolute',
                  height: '100%',
                  width: '100%',
                },
              }}
            >
              <Box
                sx={{
                  padding: '1rem',
                  position: (props) =>
                    `${type === 'Gallery' ? 'absolute' : 'relative'} `,
                  bottom: '0',
                  left: '0',
                  zIndex: '5',
                }}
              >
                <Text as="h3" sx={{ paddingBottom: '0' }}>
                  {listPage.node.title}
                </Text>
                {type === 'Blog' ? (
                  <Text as="small">{listPage.node.publishDate}</Text>
                ) : (
                  ''
                )}
              </Box>
            </Box>
          </Box>
        </Link>
      )
  );
}
