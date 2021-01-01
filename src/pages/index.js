import * as React from 'react';
import Layout from '../components/layout';

import { MDXRenderer } from 'gatsby-plugin-mdx';

// markup
const IndexPage = ({ data }) => {
  const content = data.allContentfulPage.edges;
  var wrappedLayout = content[0].node.wrappedLayout;
  return (
    <Layout wrapped={wrappedLayout}>
      <MDXRenderer>{content[0].node.body.childMdx.body}</MDXRenderer>
    </Layout>
  );
};

export const query = graphql`
  query {
    allContentfulPage(filter: { title: { eq: "Home" } }) {
      edges {
        node {
          title
          wrappedLayout
          body {
            childMdx {
              id
              body
            }
          }
        }
      }
    }
  }
`;

export default IndexPage;
