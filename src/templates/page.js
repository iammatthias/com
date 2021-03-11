/** @jsx jsx */
import { jsx, Box } from 'theme-ui';
import * as React from 'react'; //eslint-disable-line
import { darken } from '@theme-ui/color';
import { graphql } from 'gatsby';

import Layout from '../components/Layout';
import Link from '../components/joy/link';

import { MDXRenderer } from 'gatsby-plugin-mdx';

// markup
const Page = ({ data, pageContext }) => {
  const content = data.contentfulPage;
  const wrappedLayout = content.wrappedLayout;

  const comments = `https://mobile.twitter.com/search?q=${encodeURIComponent(
    `https://iammatthias.com/blog/${pageContext.pagePath}/`
  )}`;

  return (
    <Layout wrapped={wrappedLayout}>
      {content.pageType === 'Blog' ? (
        <Box
          sx={{
            padding: ['1rem 1rem 2rem', '2rem 2rem 3rem', '4rem 4rem 5rem'],
            backgroundColor: darken('background', 0.025),
          }}
        >
          <h1 sx={{ m: 0, p: 0 }}>{content.title}</h1>
          <h3 sx={{ m: 0, p: 0 }}>Published</h3>
          <h4 sx={{ m: 0, p: 0 }}>{content.publishDate}</h4>
          <br />
          <h4 sx={{ m: 0, p: 0 }}>
            <Link
              href={comments}
              sx={{
                textDecoration: 'none',
                padding: '12px 24px',
                background: 'text',
                color: 'background',
              }}
            >
              Discuss on twitter
            </Link>
          </h4>
        </Box>
      ) : content.pageType === 'Gallery' ? (
        <Box
          sx={{
            padding: ['1rem 1rem 2rem', '2rem 2rem 3rem', '4rem 4rem 5rem'],
            backgroundColor: darken('background', 0.025),
          }}
        >
          <h1 sx={{ m: 0, p: 0 }}>{content.title}</h1>
        </Box>
      ) : (
        ''
      )}
      <Box sx={{ padding: ['1rem', '2rem', '4rem'] }}>
        <MDXRenderer>{content.body.childMdx.body}</MDXRenderer>
      </Box>
      {content.pageType === 'Blog' ? (
        <Box sx={{ padding: ['1rem', '1rem 2rem', '1rem 4rem'] }}>
          <h4>
            {pageContext.previous != null ? (
              <>
                <Link
                  href={
                    'https://iammatthias.com/blog/' + pageContext.previous.slug
                  }
                >
                  Previous
                </Link>
                &nbsp;&nbsp;&nbsp;
              </>
            ) : null}

            {pageContext.next != null ? (
              <Link
                href={'https://iammatthias.com/blog/' + pageContext.next.slug}
              >
                Next
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
  query($id: String!) {
    contentfulPage(id: { eq: $id }) {
      id
      title
      slug
      wrappedLayout
      pageType
      publishDate(formatString: "MMMM Do, YYYY")
      body {
        childMdx {
          body
        }
      }
    }
  }
`;

export default Page;
