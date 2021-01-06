/** @jsx jsx */
import { jsx } from 'theme-ui';
import * as React from 'react'; //eslint-disable-line
import { graphql } from 'gatsby';

import Layout from '../components/Layout';

import { MDXRenderer } from 'gatsby-plugin-mdx';

// markup
const Page = ({ data, location }) => {
  const content = data.contentfulPage;
  const wrappedLayout = content.wrappedLayout;

  return (
    <Layout wrapped={wrappedLayout} location={location}>
      <MDXRenderer>{content.body.childMdx.body}</MDXRenderer>
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
