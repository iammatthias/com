import * as React from 'react';
import { graphql } from 'gatsby';

import Layout from '../components/layout';

import { MDXRenderer } from 'gatsby-plugin-mdx';

// markup
const Page = ({ data }) => {
  const content = data.contentfulPage;
  var wrappedLayout = content.wrappedLayout;
  return (
    <Layout wrapped={wrappedLayout}>
      <MDXRenderer>{content.body.childMdx.body}</MDXRenderer>
    </Layout>
  );
};

export const query = graphql`
  query($id: String!) {
    contentfulPage(id: { eq: $id }) {
      id
      title
      body {
        childMdx {
          body
        }
      }
      wrappedLayout
      slug
    }
  }
`;

export default Page;
