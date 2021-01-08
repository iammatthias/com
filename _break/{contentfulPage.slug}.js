/** @jsx jsx */
import { jsx } from 'theme-ui';
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
      <MDXRenderer>{content.body.childMdx.body}</MDXRenderer>
    </Layout>
  );
};

export const query = graphql`
  query($id: String!) {
    contentfulPage(pageType: { eq: "Page" }, id: { eq: $id }) {
      id
      title
      slug
      wrappedLayout
      pageType
      body {
        childMdx {
          body
        }
      }
    }
  }
`;

export default Page;
