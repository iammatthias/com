/** @jsx jsx */
import { jsx } from 'theme-ui';
import React from 'react'; //eslint-disable-line
import { graphql } from 'gatsby';
import { MDXRenderer } from 'gatsby-plugin-mdx';

import Layout from './../components/layout';

// markup
const IndexPage = ({ data }) => {
  const content = data.contentfulPage;
  return (
    <Layout>
      <article sx={{ p: ['.5rem', '2rem'] }}>
        <MDXRenderer>{content.body.childMdx.body}</MDXRenderer>
      </article>
    </Layout>
  );
};

export const query = graphql`
  query {
    contentfulPage(title: { eq: "Home" }) {
      id
      title
      slug
      body {
        childMdx {
          body
        }
      }
    }
  }
`;

export default IndexPage;
