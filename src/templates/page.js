/** @jsx jsx */
import { jsx, Box, Button } from 'theme-ui';
import React from 'react'; //eslint-disable-line
import { graphql } from 'gatsby';
import { MDXRenderer } from 'gatsby-plugin-mdx';
import { darken } from '@theme-ui/color';

import Layout from '../components/layout';
import Link from '../components/link';
import Seo from '../components/seo';

// markup
const Page = ({ data, pageContext }) => {
  const content = data.contentfulPage;
  const masonry = content.masonry;
  const comments = `https://mobile.twitter.com/search?q=${encodeURIComponent(
    `https://iammatthias.com/blog/${pageContext.pagePath}/`
  )}`;

  return (
    <Layout>
      <Seo />
      {content.pageType === 'Blog' ? (
        <Box
          sx={{
            p: ['.5rem', '2rem'],
            backgroundColor: darken('background', 0.025),
            borderRadius: '4px 4px 0 0',
          }}
        >
          <h1 sx={{ m: 0, p: 0 }}>{content.title}</h1>
          <h4 sx={{ m: 0, p: 0 }}>Published {content.publishDate}</h4>
          <br />
          <h4 sx={{ m: 0, p: 0 }}>
            <Link href={comments}>
              <Button>Discuss on twitter</Button>
            </Link>
          </h4>
        </Box>
      ) : content.pageType === 'Gallery' ? (
        <Box
          sx={{
            p: ['.5rem', '2rem'],
            backgroundColor: darken('background', 0.025),
          }}
        >
          <h1 sx={{ m: 0, p: 0 }}>{content.title}</h1>
        </Box>
      ) : (
        ''
      )}

      <article sx={{ p: ['.5rem', '2rem'] }}>
        <MDXRenderer masonry={masonry}>
          {content.body.childMdx.body}
        </MDXRenderer>
      </article>
      {content.pageType === 'Blog' ? (
        <Box sx={{ p: ['.5rem', '2rem'] }}>
          <h4>
            {pageContext.previous != null ? (
              <>
                <Link
                  href={
                    'https://iammatthias.com/blog/' + pageContext.previous.slug
                  }
                >
                  <Button>Previous</Button>
                </Link>
                &nbsp;&nbsp;&nbsp;
              </>
            ) : null}

            {pageContext.next != null ? (
              <Link
                href={'https://iammatthias.com/blog/' + pageContext.next.slug}
              >
                <Button>Next</Button>
              </Link>
            ) : null}
          </h4>
        </Box>
      ) : (
        ''
      )}
    </Layout>
  );
};

export const query = graphql`
  query ($id: String!) {
    contentfulPage(id: { eq: $id }) {
      id
      title
      slug
      pageType
      publishDate(formatString: "MMMM Do, YYYY")
      body {
        childMdx {
          body
        }
      }
      ...Masonry
    }
  }
`;

export default Page;
