// pages/index.tsx

// apollo
import { gql } from '@apollo/client';
import { contentfulClient } from '@/lib/apolloClient';

// mdx
import { serialize } from 'next-mdx-remote/serialize';
import { MDXRemote } from 'next-mdx-remote';

// helpers
import { isDev } from '@/utils/isDev';
import { Box } from '@/components/primitives/box';

export default function Home({ contentfulMdx }: any) {
  return (
    <Box
      css={{
        display: `flex`,
        flexDirection: `column`,
        alignItems: `center`,
        height: `100%`,
      }}
    >
      <MDXRemote {...contentfulMdx} />
    </Box>
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
      pageTitle: contentfulData.title ? contentfulData.title : `I Am Matthias`,
      contentfulMdx: contentfulMdxSource,
    },
  };
}
