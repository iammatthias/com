// index.tsx
// Language: typescript

// The homepage.

// apollo
import { gql } from '@apollo/client';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
// mdx
import { serialize } from 'next-mdx-remote/serialize';

import Layout from '@/components/Layout';
import { contentfulClient } from '@/utils/apolloProvider';
// helpers
import { isDev } from '@/utils/isDev';

type Props = {
  contentfulMdx: MDXRemoteSerializeResult;
};

export default function Home({ contentfulMdx }: Props) {
  return (
    <Layout as="main" layout="pageContent">
      <MDXRemote {...contentfulMdx} />
    </Layout>
  );
}

//////////////// PAGE CONTENT /////////////////////

// We use getStaticProps to get the content at build time
export async function getStaticProps() {
  // We define our query here
  const { data: contentfulData } = await contentfulClient.query({
    query: gql`
      query ($preview: Boolean) {
        pageCollection(where: { slug: "home" }, preview: $preview) {
          items {
            title
            body
          }
        }
      }
    `,
    variables: {
      preview: isDev,
    },
  });

  const contentfulSource = contentfulData.pageCollection.items[0].body;
  const contentfulMdxSource = await serialize(contentfulSource);

  // We return the result of the query as props to pass them above
  return {
    props: {
      pageTitle: `I Am Matthias`,
      contentfulMdx: contentfulMdxSource,
    },
  };
}
