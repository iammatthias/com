// pages/index.tsx

// apollo
import { gql } from '@apollo/client';
import client from '@/lib/apolloClient';

// mdx
import { serialize } from 'next-mdx-remote/serialize';
import { MDXRemote } from 'next-mdx-remote';

// helpers
import { isDev } from '@/utils/isDev';

// components

export default function Home({ mdx }: any) {
  return <MDXRemote {...mdx} />;
}

//////////////// PAGE CONTENT /////////////////////

// We use getStaticProps to get the content at build time
export async function getStaticProps() {
  // We define our query here
  const { data } = await client.query({
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

  const source = data.pageCollection.items[0].body;
  const mdxSource = await serialize(source);

  // We return the result of the query as props to pass them above
  return {
    props: {
      pageTitle: data.title ? data.title : `I Am Matthias`,
      mdx: mdxSource,
    },
  };
}
