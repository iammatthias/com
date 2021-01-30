/** @jsx jsx */
import { jsx, Box } from 'theme-ui';
import * as React from 'react'; //eslint-disable-line
import { graphql } from 'gatsby';

import Layout from '../components/Layout';

import { MDXRenderer } from 'gatsby-plugin-mdx';

// markup
const Page = ({ data }) => {
  const content = data.contentfulPage;
  const wrappedLayout = content.wrappedLayout;

  return (
    <Layout wrapped={wrappedLayout}>
      <Box sx={{ padding: ['1rem', '2rem', '4rem'] }}>
        <MDXRenderer>{content.body.childMdx.body}</MDXRenderer>
      </Box>
    </Layout>
  );
};

export const query = graphql`
  query {
    contentfulPage(title: { eq: "Home" }) {
      id
      title
      slug
      wrappedLayout
      body {
        childMdx {
          body
        }
      }
    }
  }
`;

export default Page;
